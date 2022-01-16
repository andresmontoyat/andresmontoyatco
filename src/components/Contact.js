import React from 'react'
import { useForm } from 'react-hook-form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'

export default function Contact() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const handleContactForm = (formData) => {
    console.log(formData)
  }

  return (
    <section className="relative max-w-7xl mx-auto lg:grid lg:grid-cols-5">
      <div className="absolute inset-0 pointer-events-none sm:hidden" aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full" width="343" height="388" viewBox="0 0 343 388" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <path d="M-99 461.107L608.107-246l707.103 707.107-707.103 707.103L-99 461.107z" fill="url(#linear1)" fillOpacity=".1" />
          <defs>
            <linearGradient id="linear1" x1="254.553" y1="107.554" x2="961.66" y2="814.66" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="hidden absolute top-0 right-0 bottom-0 w-1/2 pointer-events-none sm:block lg:hidden" aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full" width="359" height="339" viewBox="0 0 359 339" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <path d="M-161 382.107L546.107-325l707.103 707.107-707.103 707.103L-161 382.107z" fill="url(#linear2)" fillOpacity=".1" />
          <defs>
            <linearGradient id="linear2" x1="192.553" y1="28.553" x2="899.66" y2="735.66" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="hidden absolute top-0 right-0 bottom-0 w-1/2 pointer-events-none lg:block" aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full" width="160" height="678" viewBox="0 0 160 678" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <path d="M-161 679.107L546.107-28l707.103 707.107-707.103 707.103L-161 679.107z" fill="url(#linear3)" fillOpacity=".1" />
          <defs>
            <linearGradient id="linear3" x1="192.553" y1="325.553" x2="899.66" y2="1032.66" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="bg-blue-500 text-white py-16 px-4 sm:px-6 lg:col-span-2 lg:px-8 lg:py-24 xl:pr-12">
        <div className="max-w-lg mx-auto">
          <h2 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Get in touch
          </h2>
          <p className="mt-3 text-lg leading-6 text-white">
            Feel free to get in touch with me. I am always open to discussing
            new projects, creative ideas or new opportunities.
          </p>
          <dl className="mt-8 text-base text-white">
            <div>
              <dt className="sr-only">Address point</dt>
              <dd>
                <p>Cr. 28E # 2B - 104, Lane Paisandu</p>
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
          <form action="#" method="POST" className="grid grid-cols-1 gap-y-6" onSubmit={handleSubmit(handleContactForm)}>
            <div>
              <label htmlFor="full-name" className="sr-only">
                Full name
              </label>
              <input
                type="text"
                {...register('fullname', {
                  maxLength: 100,
                  required: true
                })}
                autoComplete="off"
                className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                placeholder="Full name"
              />
              { errors.fullname && errors.fullname?.type === 'required' && (
                <span className="appearance-none block text-red-600 font-medium sm:text-sm">This field is required</span>
              )}
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Your Email
              </label>
              <input
                type="email"
                {...register('email', {
                  maxLength: 280,
                  required: true
                })}
                autoComplete="off"
                className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                placeholder="Your Email"
              />
              { errors.email && errors.email?.type === 'required' && (
                <span className="appearance-none block text-red-600 font-medium sm:text-sm">This field is required</span>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">
                Your Phone
              </label>
              <input
                type="text"
                name="phone"
                id="phone"
                autoComplete="off"
                className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                placeholder="Your Phone"
              />
            </div>
            <div>
              <label htmlFor="message" className="sr-only">
                Your Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border border-gray-300 rounded-md"
                placeholder="Your Message"
                autoComplete="off"
              />
            </div>
            <div>
              <button
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
  )
}
