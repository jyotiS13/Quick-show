import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
   <footer className="px-6 md:px-16 lg:px-36 mt-40 w-full text-gray-300">
            <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500 pb-14">
                <div className="md:max-w-96">
                    <img className="h-9" src={assets.logo} alt="logo" />
                    <p className="mt-6 text-sm">
                        Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                        Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
                        when an unknown printer took a galley of type and scrambled it to make a type specimen book.
                    </p>
                    <div className='flex items-center gap-2 mt-4'>
                        <img src={assets.googlePlay}alt="google play" className='h-9 w-auto'/>
                        <img src={assets.appStore}ait="app store" className='h-9 w-auto'/>
                         
                    </div>
                </div>
                <div className="flex-1 flex items-start md:justify-end gap-20">
                    <div>
                        <h2 className="font-semibold mb-5 text-white-800">Company</h2>
                        <ul className="text-sm space-y-2">
                            <li><a href="#">Home</a></li>
                            <li><a href="#">About us</a></li>
                            <li><a href="#">Contact us</a></li>
                            <li><a href="#">Privacy policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="font-semibold text-white-800 mb-5">Get in Touch</h2>
                        <div className="text-sm space-y-2">
                            <p>+1-234-567-890.</p>
                            <p>contact@example.com</p>
                            <div className="flex items-center gap-2 pt-4">
                                {/* <input className="border border-gray-500/30 placeholder-gray-500 focus:ring-2 ring-indigo-600 outline-none w-full max-w-64 h-9 rounded px-2" type="email" placeholder="Enter your email" />
                                <button className="bg-blue-600 w-24 h-9 text-white rounded">Subscribe</button> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <p className="pt-4 text-center text-sm pb-5">
                Copyright {new Date().getFullYear()} © Jyotrimayee Swain. All Right Reserved.
            </p>
        </footer>
  )
}

export default Footer
