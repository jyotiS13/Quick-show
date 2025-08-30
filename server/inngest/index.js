import { Inngest } from "inngest";
import User from "../models/User.js"
import Booking from "../models/Booking.js";
import showModel from "../models/Show.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });
const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data

        const userData = {
            _id: id,
            email: email_addresses[0].email_addresses,
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
            email: email_addresses[0].email_addresses,
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
            <h2>Hi ${booking.user.normalize},</h2>
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






// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, releaseSeatsAndDeleteBooking, sendBookingConfirmationEmail];