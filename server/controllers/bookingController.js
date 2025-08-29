

//function to check availability of selectrd seats for a movie

import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import showModel from "../models/Show.js";
import stripe from "stripe"

const checkSeatsAvailability = async (showId, selectedSeats) => {
    try {
        const showData = await showModel.findById(showId)
        if (!showData) return false;

        const occupiedSeats = showData.occupiedseats

        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);

        return !isAnySeatTaken;

    } catch (error) {
        console.log(error.message);
        return false;


    }
}

export const createBooking = async (req,res) => {
    try {
        const { userId } = req.auth();
        
        const { showId, selectedSeats } = req.body
        const { origin } = req.headers;

        //Check if the seat in available for the selected show
        const isAvailable = await checkSeatsAvailability(showId, selectedSeats)

        if (!isAvailable) {
            return res.json({ success: false, message: "Selected Seats are not available. " })
        }

        //Get the show Details
        const showData = await showModel.findById(showId).populate("movie");
        
        //creat a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats

        })

        selectedSeats.map((seat) => {
            showData.occupiedseats[seat] = userId

        })
        showData.markModified("occupiedseats")
        await showData.save();

        //stripe Gateway 
        const stripeInstance=new stripe(process.env.STRIPE_SECRET_KEY)
        //creating line items
        const line_items=[{
            price_data:{
                currency:"usd",
                product_data:{
                    name:showData.movie.title
                },
                unit_amount:Math.floor(booking.amount) *100
            },
            quantity:1
        }]
        const session=await stripeInstance.checkout.sessions.create({
            success_url:`${origin}/loading/my-bookings`,
            cancel_url:`${origin}/my-bookings`,
            line_items:line_items,
            mode:"payment",
            metadata:{
                bookingId:booking._id.toString()
            },
            expires_at:Math.floor(Date.now()/1000) +30 * 60,
        })
        booking.paymentLink=session.url
        await booking.save()
        //Run inngest sheduler fun to check payment status after 10 min
        await inngest.send({
            name:"app/checkpayment",
            date:{
                bookingId:booking._id.toString()
            }
        })
        res.json({success:true,url:session.url})


    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message}) 
    }
}

export const getOccupiedSeats=async (req,res) =>{
    try {
        const {showId}=req.params;
        const showData=await showModel.findById(showId)
        console.log(showData)

        const occupiedSeats=Object.keys(showData.occupiedseats)
        res.json({success:true,occupiedSeats})
        
    } catch (error) {
         console.log(error.message);
        res.json({success:false,message:error.message}) 
    }
        
    
}