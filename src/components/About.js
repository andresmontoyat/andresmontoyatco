import React from 'react'

export default function About() {
  const experiencieStart = 2007
  const experiencieYears = new Date().getFullYear() - experiencieStart
  const coffess = 366 * experiencieYears
  return (
    <div className="relative bg-white py-16 sm:py-24">
      <div className="lg:mx-auto lg:max-w-7xl lg:px-8 lg:grid lg:grid-cols-2 lg:gap-24 lg:items-start">
        <div className="relative sm:py-16 lg:py-0">
          <div aria-hidden="true" className="hidden sm:block lg:absolute lg:inset-y-0 lg:right-0 lg:w-screen">
            <div className="absolute inset-y-0 right-1/2 w-full bg-gray-50 rounded-r-3xl lg:right-72" />
            <svg className="absolute top-8 left-1/2 -ml-3 lg:-right-8 lg:left-auto lg:top-12" width="404" height="392" fill="none" viewBox="0 0 404 392">
              <defs>
                <pattern id="02f20b47-fd69-4224-a62a-4c9de5c763f7" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="4" height="4" className="text-gray-200" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="392" fill="url(#02f20b47-fd69-4224-a62a-4c9de5c763f7)" />
            </svg>
          </div>
          <div className="relative mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-0 lg:max-w-none lg:py-20">
            <div className="relative pt-64 pb-40 rounded-2xl shadow-xl overflow-hidden">
              <img className="absolute inset-0 h-full w-full" src="images/me.webp" alt="" height="400" />
            </div>
          </div>
        </div>
        <div className="relative mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-0">
          <div className="pt-12 sm:pt-16 lg:pt-20">
            <h2 className="text-3xl text-gray-900 font-extrabold tracking-tight sm:text-4xl">
              Carlos Andr&eacute;s Montoya Tob&oacute;n
            </h2>
            <h4 className="text-1xl text-gray-900 font-extrabold tracking-tight sm:text-1xl">
              Java solution architect and full stack developer and devops advocate
            </h4>
            <div className="mt-6 text-gray-500 space-y-6">
              <p className="text-lg">
                Passionate about software development and everything related to technology. I love learning and sharing the knowledge that I have acquired in the last {experiencieYears} years.
              </p>
              <p className="text-base leading-7">
                I &hearts; to build ideas and enjoy my free time with my best friends while we talk about new technologies.
              </p>
              <p className="text-base leading-7">
                My specialty is the architecture and development of web applications with Spring Framework.
              </p>
            </div>
          </div>
          <div className="mt-8 overflow-hidden">
            <dl className="-mx-8 -mt-8 flex flex-wrap">
              <div className="flex flex-col px-8 pt-8">
                <dt className="order-2 text-base font-medium text-gray-500">
                  Start
                </dt>
                <dd className="order-1 text-2xl font-extrabold text-blue-600 sm:text-3xl">
                  {experiencieStart}
                </dd>
              </div>
              <div className="flex flex-col px-8 pt-8">
                <dt className="order-2 text-base font-medium text-gray-500">
                  Coffees
                </dt>
                <dd className="order-1 text-2xl font-extrabold text-blue-600 sm:text-3xl">
                  {coffess}
                </dd>
              </div>
              <div className="flex flex-col px-8 pt-8">
                <dt className="order-2 text-base font-medium text-gray-500">
                  Projects
                </dt>
                <dd className="order-1 text-2xl font-extrabold text-blue-600 sm:text-3xl">
                  20+
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
