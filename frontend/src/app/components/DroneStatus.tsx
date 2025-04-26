import React from 'react'

interface DroneStatusProps {
    className?: string;
  }

const DroneStatus = ({className}: DroneStatusProps) => {
  return (
    <section className={className}>DroneStatus</section>
  )
}

export default DroneStatus