import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faDatabase } from '@fortawesome/free-solid-svg-icons'
import { faGithub, faDocker, faLinkedin, faYoutube, faJava, faJenkins, faJs, faAws, faLinux } from '@fortawesome/free-brands-svg-icons'

const features = [
  {
    name: 'Java',
    description: 'Consequuntur omnis dicta cumque, inventore atque ab dolores aspernatur tempora ab doloremque.',
    icon: () => (
      <FontAwesomeIcon icon={faJava} size="2x" />
    )
  },
  {
    name: 'Javascript',
    description:
      'Omnis, illo delectus? Libero, possimus nulla nemo tenetur adipisci repellat dolore eligendi velit doloribus mollitia.',
    icon: () => (
      <FontAwesomeIcon icon={faJs} size="2x" />
    )
  },
  {
    name: 'Linux',
    description:
      'Corporis quisquam nostrum nulla veniam recusandae temporibus aperiam officia incidunt at distinctio ratione.',
    icon: () => (
      <FontAwesomeIcon icon={faLinux} size="2x" />
    )
  },
  {
    name: 'DevOps',
    description:
      'Corporis quisquam nostrum nulla veniam recusandae temporibus aperiam officia incidunt at distinctio ratione.',
    icon: () => (
      <FontAwesomeIcon icon={faJenkins} size="2x" />
    )
  },
  {
    name: 'AWS',
    description:
      'Veniam necessitatibus reiciendis fugit explicabo dolorem nihil et omnis assumenda odit? Quisquam unde accusantium.',
    icon: () => (
      <FontAwesomeIcon icon={faAws} size="2x" />
    )
  },
  {
    name: 'Databases',
    description:
      'Veniam necessitatibus reiciendis fugit explicabo dolorem nihil et omnis assumenda odit? Quisquam unde accusantium.',
    icon: () => (
      <FontAwesomeIcon icon={faDatabase} size="2x" />
    )
  }
]

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

export default function App() {
  const year = new Date().getFullYear()
  return (
    <div className="min-h-screen bg-white">
      <header className="relative pb-36 bg-blue-gray-800">
        Under construction
      </header>
      <section className="bg-gray-50 overflow-hidden">
        <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <svg
            className="absolute top-0 left-full transform -translate-x-1/2 -translate-y-3/4 lg:left-auto lg:right-full lg:translate-x-2/3 lg:translate-y-1/4"
            width={404}
            height={784}
            fill="none"
            viewBox="0 0 404 784"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="8b1b5f72-e944-4457-af67-0c6d15a99f38"
                x={0}
                y={0}
                width={20}
                height={20}
                patternUnits="userSpaceOnUse"
              >
                <rect x={0} y={0} width={4} height={4} className="text-gray-200" fill="currentColor" />
              </pattern>
            </defs>
            <rect width={404} height={784} fill="url(#8b1b5f72-e944-4457-af67-0c6d15a99f38)" />
          </svg>

          <div className="relative lg:grid lg:grid-cols-3 lg:gap-x-8">
            <div className="lg:col-span-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                These are some of my skills
              </h2>
            </div>
            <dl className="mt-10 space-y-10 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:mt-0 lg:col-span-2">
              {features.map((feature) => (
                <div key={feature.name}>
                  <dt>
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="mt-5 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                  </dt>
                  <dd className="mt-2 text-base text-gray-500">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
      <section className="relative max-w-7xl mx-auto lg:grid lg:grid-cols-5">
        <div className="bg-blue-500 text-white py-16 px-4 sm:px-6 lg:col-span-2 lg:px-8 lg:py-24 xl:pr-12">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Get in touch</h2>
            <p className="mt-3 text-lg leading-6 text-white">
              Nullam risus blandit ac aliquam justo ipsum. Quam mauris volutpat massa dictumst amet. Sapien tortor lacus
              arcu.
            </p>
            <dl className="mt-8 text-base text-white">
              <div>
                <dt className="sr-only">Postal address</dt>
                <dd>
                  <p>Cr. 28E #2B - 104, Paisandu</p>
                  <p>Santa Elena, Medell&iacute;n - Colombia</p>
                </dd>
              </div>
              <div className="mt-3">
                <dt className="sr-only">Email</dt>
                <dd className="flex">
                  <FontAwesomeIcon icon={faPaperPlane} size="1x" />
                  <span className="ml-3">andresmontoyat@gmail.com</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="bg-white py-16 px-4 sm:px-6 lg:col-span-3 lg:py-24 lg:px-8 xl:pl-12">
          <div className="max-w-lg mx-auto lg:max-w-none">
            <form action="#" method="POST" className="grid grid-cols-1 gap-y-6">
              <div>
                <label htmlFor="full-name" className="sr-only">
                  Full name
                </label>
                <input
                  type="text"
                  name="full-name"
                  id="full-name"
                  autoComplete="name"
                  className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                  placeholder="Email"
                />
              </div>
              <div>
                <label htmlFor="phone" className="sr-only">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  autoComplete="off"
                  className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                  placeholder="Phone"
                />
              </div>
              <div>
                <label htmlFor="message" className="sr-only">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border border-gray-300 rounded-md"
                  placeholder="Message"
                  autoComplete="off"
                />
              </div>
              <div>
                <button
                  disabled="true"
                  type="submit"
                  className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Lets to talk
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
      <footer className="bg-blue-gray-50" aria-labelledby="footer-heading">
        <div className="max-w-md mx-auto py-12 px-4 sm:max-w-7xl sm:px-6 lg:py-16 lg:px-8 border-t border-blue-gray-200">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <img
                className="h-10"
                src="https://tailwindui.com/img/logos/workflow-mark.svg?color=blueGray&shade=300"
                alt="Company name"
              />
              <p className="text-blue-gray-500 text-base">
                Making the world a better place through constructing elegant hierarchies.
              </p>
              <div className="flex space-x-6">
                {footerNavigation.social.map((item) => (
                  <a key={item.name} href={item.href} className="text-blue-gray-400 hover:text-blue-gray-500">
                    <span className="sr-only">{item.name}</span>
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-blue-gray-400 tracking-wider uppercase">Links</h3>
                  <ul className="mt-4 space-y-4">
                    {footerNavigation.links.map((item) => (
                      <li key={item.name}>
                        <a href={item.href} title={item.name} className="text-base text-blue-gray-500 hover:text-blue-gray-900">
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-blue-gray-200 pt-8">
            <p className="text-base text-blue-gray-400 xl:text-center">
              &copy; { year } Andr&eacute;s Montoya. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
