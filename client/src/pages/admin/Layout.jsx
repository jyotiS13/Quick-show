import React from 'react'
import AdminNavbar from '../../components/admin/AdminNavbar'
import AdminSibebar from '../../components/admin/AdminSibebar'
import { Outlet } from 'react-router-dom'
import { useAppContext } from '../../context/appContext'
import { useEffect } from 'react'
import Loading from '../../components/Loading'

const Layout = () => {

  const {isAdmin,fetchIsAdmin}=useAppContext()
  useEffect(()=>{
    fetchIsAdmin()
  },[])
  return isAdmin ?(
    <>
      <AdminNavbar/>
      <div className='flex'>
        <AdminSibebar />
        <div className='flex-1 px-4 py-10 md:px-10 h-[calc(100vh-64px)]overflow-y-auto'>
            <Outlet />
        </div>
      </div>
    
    </>
  ) : <Loading />
}

export default Layout
