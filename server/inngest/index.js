import { Inngest } from "inngest";
import User from "../models/User.js"
import Booking from "../models/Booking.js";
import showModel from "../models/Show.js";
import sendEmail from "../config/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });
const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + " " + last_name,
            image: image_url
        }
        await User.create(userData)

    }
)
//Inngest Function to delete user from database

const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-with-clerk" },
    { event: "clerk/user.deleted" },

    async ({ event }) => {

        const { id } = event.data
        await User.findByIdAndDelete(id)
    }
)


//update userdata
const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk" },
    { event: "clerk/user.updated" },

    async ({ event }) => {

        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + " " + last_name,
            image: image_url
        }
        await User.findByIdAndUpdate(id, userData)
    }
)
//Inngest fun to cancel booking and release seats of show after 10 min of booking created if payment is not made.
const releaseSeatsAndDeleteBooking = inngest.createFunction(
    { id: "release-seats-delete-booking" },
    { event: "app/checkpayment" },
    async ({ event, step }) => {
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil("wait-for-10-minutes", tenMinutesLater)

        await step.run("check-payment-status", async () => {
            const bookingId = event.data.bookingId
            const booking = await Booking.findById(bookingId)
            //if payment is not made,release seats and delete booking
            if (!booking.isPaid) {
                const show = await showModel.findById(booking.show);
                booking.bookedSeats.forEach((seat) => {
                    delete show.occupiedseats[seat]

                });
                show.markModified("occupiedseats")
                await show.save()
                await Booking.findByIdAndDelete(booking._id)
            }
        })

    }
)
//Inngest fun to send email when user books a show
const sendBookingConfirmationEmail = inngest.createFunction(
    { id: "send-booking-confirmation-email" },
    { event: "app/show.booked" },
    async ({ event, step }) => {
        const { bookingId } = event.data;

        const booking = await Booking.findById(bookingId).populate({
            path: "show",
            populate: { path: "movie", model: "Movie" }
        }).populate("user");

        await sendEmail({
            to: booking.user.email,
            subject: `Payment Confirmation:"${booking.show.movie.title}"booked!`,
            body: `<div style="font-family: Arial, sans-serif; line-height:1.5;">
            <h2>Hi ${booking.user.normalize()},</h2>
            <p>Your booking for 
            <strong style="color: #F84565;">
            "${booking.show.movie.title}"
            </strong> is confirmed.</p>
            <p>
                <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timezone: 'Asia/Kolkata' })}<br/>
                <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { timezone: 'Asia/Kolkata' })}
            </p>
            <p>Enjoy the Show!</p>
            <p>Thanks for booking with us!<br/> With love from Jyotrimayee Swain</p>
            </div>`


        })
    }
)
//Inngest fun to send reminder
const sendShowReminders = inngest.createFunction(
    { id: "send-show-reminders" },
    { cron: "0 */8 * * *" },//Every 8 hours
    async ({ step }) => {
        const now = new Date();
        const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000)

        //prepare reminder Tasks
        const reminderTasks = await step.run("prepare-reminder-tasks", async () => {
            const shows = await showModel.find({
                showTime: { $gte: windowStart, $lte: in8Hours },

            }).populate("movie")

            const tasks = [];
            for (const show of shows) {
                if (!show.movie || !show.occupiedseats) continue;

                const userIds = [...new Set(Object.values(show.occupiedseats))];
                if (userIds.length === 0) continue;

                const users = await User.find({ _id: { $in: userIds } }).select("name email");

                for (const user of users) {
                    tasks.push({
                        userEmail: user.email,
                        userName: user.name,
                        movieTitle: show.movie.title,
                        showTime: show.showTime
                    })

                }


            }
            return tasks;

        })
        if (reminderTasks.length === 0) {
            return { sent: 0, message: "No reminders to send" }
        }
        //Send reminder Email
        const results = await step.run("send-all-reminders", async () => {
            return await Promise.allSettled(
                reminderTasks.map(task => sendEmail)({
                    to: task.userEmail,
                    subject: `Reminder:Your movie "${task.movieTitle}"starts soon!!`,
                    body: `<div style="font-family:Arial,sans-serif;padding:20px;">
                    <h2>Hello ${task.userName},</h2>
                    <p>This is quick reminder that your movie:</p>
                    <h3 style="color:#F84565;">"${task.movieTitle}"</h3>
                    <p>
                    is scheduled for <strong>${new Date(task.showTime).toLocaleDateString("en-US",{timeZone:'Asia/Kolkata'})}</strong> at
                    <strong>${new Date(task.showTime).toLocaleTimeString('en-US',{timeZone:'Asia/Kolkata'})}</strong> 
                    </p>
                    <p>it starts in approximately <strong>8 hours</strong>-make sure you're ready !!</p>
                    <br/>
                    <p>Enjoy the show<br/>QuickShow Team </p>
                    
                    </div>`
                })
            )
        })
        const sent=results.filter(r=>r.status==="fulfilled").length;
        const failed=results.length-sent;


        return {
            sent,
            failed,
            message:`Sent ${sent} reminder(s),${failed} failed`
        }

    }


)
const sendNewShowNotifications=inngest.createFunction(
    {id:"send-new-show-notifications"},
    {event:"app/show.added"},
    async({event})=>{
        const {movieTitle}=event.data;

        const users=await User.find({})

        for(const user of users){
            const userEmail=user.email;
            const userName=user.name;

            const subject=` 🎬 New Show Added:${movieTitle}`;
            const body=`<div style="font-family:Arial,sans-serif;padding:20px;">
            <h2>Hi ${userName}</h2>
            <p>We habe just added a new show to our library</p>
            <h3 style="color:#F84565;">"${movieTitle}"</h3>
            <p>Visit our Website</p>
            <br/>
            <p>Thanks,<br/>QuickShow Team</p>
            </div>`;
            await sendEmail({
            to:userEmail,
            subject,
            body,
        })
           
        }
        return {message:"Notifications sent"}

        

    }
)






// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, releaseSeatsAndDeleteBooking, sendBookingConfirmationEmail,sendShowReminders,sendNewShowNotifications];