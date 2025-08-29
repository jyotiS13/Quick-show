import React from 'react'
import Navbar from './components/Navbar';
import { Route, Routes, useLocation } from "react-router-dom";
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import SeatLayout from './pages/SeatLayout';
import MyBooking from './pages/MyBooking';
import Favourite from './pages/Favourite';
import { Toaster } from "react-hot-toast";
import Footer from "./components/Footer"
import Home from './pages/Home';
import Layout from './pages/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import AddShow from './pages/admin/AddShow';
import ListShow from './pages/admin/ListShow';
import ListBooking from './pages/admin/ListBooking';

import { SignIn } from '@clerk/clerk-react';
import { useAppContext } from './context/appContext';
import Loading from './components/Loading';

const App = () => {
  const isAdminRoute = useLocation().pathname.startsWith('/admin')

  const {user}=useAppContext()

  return (
    <>
      <Toaster />
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />;
        <Route path="/movies" element={<Movies />} />;
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/movies/:id/:date" element={<SeatLayout />} />
        <Route path="/my-bookings" element={<MyBooking />} />
         <Route path="/loading/:nextUrl" element={<Loading />} />
        <Route path="/favorite" element={<Favourite />} />
        <Route path="/admin/*" element={user ?<Layout /> :(
          <div className='min-h-screen flex justify-center items-center'>
            <SignIn fallbackRedirectUrl={"/admin"} />
          </div>
        )}>
          <Route index path='dashboard' element={<Dashboard />} />
          <Route path="add-shows"element={<AddShow />} />
          <Route path="list-shows" element={<ListShow />} />
          <Route path="list-bookings" element={<ListBooking />} />
          

        </Route>
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  )
}

export default App;
