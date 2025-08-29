import { Router } from "express";
import { createBooking, getOccupiedSeats } from "../controllers/bookingController.js";

const bookingRouter=Router();

bookingRouter.post("/create",createBooking);
bookingRouter.get("/seats/:showId",getOccupiedSeats);


export default bookingRouter;
