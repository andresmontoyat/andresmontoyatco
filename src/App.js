import React from 'react'

import About from './components/About'
import Skill from './components/Skill'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <About />
      <Skill />
      <Contact />
      <Footer />
  <iframe src="https://flypass-mapbox.netlify.app" allow="geolocation 'self' https://andresmontoyat.co"  width="100%" height="400" />
    </div>
  )
}
