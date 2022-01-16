import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub, faDocker, faLinkedin, faYoutube } from '@fortawesome/free-brands-svg-icons'

const footerNavigation = {
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
      )
    },
    {
      name: 'GitHub',
      href: 'https://github.com/andresmontoyat',
      icon: () => (
        <FontAwesomeIcon icon={faGithub} size="2x" />
      )
    },
    {
      name: 'Docker',
      href: 'https://hub.docker.com/u/codehunters',
      icon: () => (
        <FontAwesomeIcon icon={faDocker} size="2x" />
      )
    },
    {
      name: 'Yotube',
      href: 'https://www.youtube.com/user/andresmontoyat',
      icon: () => (
        <FontAwesomeIcon icon={faYoutube} size="2x" />
      )
    }
  ]
}

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-blue-gray-50" aria-labelledby="footer-heading">
      <div className="max-w-md mx-auto py-12 px-4 sm:max-w-7xl sm:px-6 lg:py-16 lg:px-8 border-t border-blue-gray-200">
        <div className="grid grid-cols-3 grid-flow-col">
          <div className="space-y-8 col-span-1">
            <img className="inline-block h-14 w-14 rounded-full" src="images/me.webp" alt="" />
            <p className="text-blue-gray-500 text-base">
              I &hearts; write code.<br />
              Let&apos;s build something amazing together.
            </p>
            <div className="flex space-x-6">
              {footerNavigation.social.map((item) => (
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
          </div>
          <div className="space-y-8 col-span-8">
            <nav className="py-12 px-4 -mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
              {footerNavigation.links.map((item) => (
                <div className="px-5 py-2">
                  <a href={item.href} title={item.name} className="text-base text-gray-500 hover:text-gray-900">
                    {item.name}
                  </a>
                </div>
              ))}
            </nav>
          </div>
        </div>
        <div className="mt-12 border-t border-blue-gray-200 pt-8">
          <p className="text-base text-blue-gray-400 xl:text-center">
            &copy; {year} Carlos Andr&eacute;s Montoya Tob&oacute;n. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
