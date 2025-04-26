import React from 'react'
interface MapProps {
    className?: string;
  }
const Map = ({className}: MapProps) => {
  return (
    <section className={className}>Map</section>
  )
}

export default Map