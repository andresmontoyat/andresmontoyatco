import React from 'react'
import { useForm } from 'react-hook-form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faGlobe, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'

export default function Contact() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const handleContactForm = (formData) => {
    console.log(formData)
  }

  return (
    <section className="relative max-w-7xl mx-auto lg:grid lg:grid-cols-5">
      <div className="bg-blue-500 text-white py-16 px-4 sm:px-6 lg:col-span-2 lg:px-8 lg:py-24 xl:pr-12 rounded-md shadow-2xl">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Get in touch
          </h2>
          <p className="mt-3 text-lg leading-6 text-white">
            Please fill out the form on this section to contact with me.
          </p>
          <dl className="mt-8 text-base text-white">
            <div className="mt-3">
              <dd className="flex">
                <FontAwesomeIcon icon={faMapMarkerAlt} size="1x" />
                <span className="ml-3">Cr. 28E #2B - 104, Paisandu - Santa Elena</span>
              </dd>
            </div>
            <div className="mt-3">
              <dd className="flex">
                <FontAwesomeIcon icon={faPaperPlane} size="1x" />
                <span className="ml-3">andresmontoyat@gmail.com</span>
              </dd>
            </div>
            <div className="mt-3">
              <dd className="flex">
                <FontAwesomeIcon icon={faGlobe} size="1x" />
                <span className="ml-3">andresmontoyat.co</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="bg-white py-16 px-4 sm:px-6 lg:col-span-3 lg:py-24 lg:px-8 xl:pl-12">
        <div className="max-w-lg mx-auto lg:max-w-none">
          <form action="#" method="POST" onSubmit={handleSubmit(handleContactForm)} className="grid grid-cols-1 gap-y-6">
            <div>
              <label htmlFor="full-name" className="sr-only">
                Full name
              </label>
              <input
                {...register('name', {
                  maxLength: 100,
                  required: true
                })}
                type="text"
                id="name"
                autoComplete="off"
                className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                placeholder="Full name"
              />
              { errors.name && errors.name?.type === 'required' && (
                <span className="appearance-none block text-red-600 font-medium sm:text-sm">This field is required</span>
              )}
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                {...register('email', {
                  maxLength: 280,
                  required: true
                })}
                id="email"
                type="email"
                autoComplete="off"
                className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                placeholder="Email"
              />
              { errors.email && errors.email?.type === 'required' && (
                <span className="appearance-none block text-red-600 font-medium sm:text-sm">This field is required</span>
              )}
            </div>
            <div>
              <label htmlFor="message" className="sr-only">
                Message
              </label>
              <textarea
                {...register('message', {
                  maxLength: 300,
                  required: true
                })}
                id="message"
                rows={4}
                className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border border-gray-300 rounded-md"
                placeholder="Message"
                autoComplete="off"
              />
              { errors.message && errors.message?.type === 'required' && (
                <span className="appearance-none block text-red-600 font-medium sm:text-sm">This field is required</span>
              )}
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
