import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub, faDocker, faLinkedin, faYoutube } from '@fortawesome/free-brands-svg-icons'

const navigation = {
  links: [
    { name: 'Home', href: '#' },
    { name: 'About', href: '#' },
    { name: 'Resume', href: '#' },
    { name: 'Contact', href: '#' },
  ],
  social: [
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/in/carlos-andres-montoya-tobon-8b508033/',
      icon: () => (
        <FontAwesomeIcon icon={faLinkedin} size="2x" />
      ),
    },
    {
      name: 'GitHub',
      href: 'https://github.com/andresmontoyat',
      icon: () => (
        <FontAwesomeIcon icon={faGithub} size="2x" />
      ),
    },
    {
      name: 'Docker',
      href: 'https://hub.docker.com/u/codehunters',
      icon: () => (
        <FontAwesomeIcon icon={faDocker} size="2x" />
      ),
    },
    {
      name: 'Yotube',
      href: 'https://www.youtube.com/user/andresmontoyat',
      icon: () => (
        <FontAwesomeIcon icon={faYoutube} size="2x" />
      ),
    }
  ],
}

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-blue-gray-50" aria-labelledby="footer-heading">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
          {navigation.links.map((item) => (
            <div key={item.name} className="px-5 py-2">
              <a href={item.href} className="text-base text-gray-500 hover:text-gray-900">
                {item.name}
              </a>
            </div>
          ))}
        </nav>
        <div className="mt-8 flex justify-center space-x-6">
          {navigation.social.map((item) => (
            <a
              key={item.name}
              href={item.href}
              title={item.name}
              className="text-blue-gray-400 hover:text-blue-gray-500"
            >
              <span className="sr-only">{item.name}</span>
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="mt-8 text-center text-base text-gray-400">&copy; {year} Carlos Andr&eacute;s Montoya Tob&oacute;n. All rights reserved.</p>
      </div>
    </footer>
  )
}
