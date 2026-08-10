import React from 'react'

interface ContainerProps{
  children:React.ReactNode;
  className?:string
}

export default function Container ({children,className=""}:ContainerProps){
return (
  <div className={` mx-auto w-screen box-content
    flex justify-center items-center xl:w-7xl ${className}`}>{children}</div>
)
}