import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDatabase, faCloud } from '@fortawesome/free-solid-svg-icons'
import { faJava, faJenkins, faJs, faLinux } from '@fortawesome/free-brands-svg-icons'

const features = [
  {
    name: 'Java',
    description: 'with more than 15 years developing java applications or platforms. Additional experience in other frameworks such as Spring Framework, Struts, JSF, Play Framework, etc.',
    icon: () => (
      <FontAwesomeIcon icon={faJava} size="2x" />
    )
  },
  {
    name: 'Javascript',
    description:
    'with more than 15 years using javascript for different applications or platforms. Some libraries and frameworks used like jQuery, Dojo, NodeJS, ExpressJS, VueJS & ReactJS.',
    icon: () => (
      <FontAwesomeIcon icon={faJs} size="2x" />
    )
  },
  {
    name: 'Linux',
    description:
    'Linux fanboy. I have been using Linux for more than 15 years. I have been using it for development, administration, and hosting of websites.',
    icon: () => (
      <FontAwesomeIcon icon={faLinux} size="2x" />
    )
  },
  {
    name: 'DevOps',
    description:
    'Appasionate about the DevOps Culture. I have experience in the DevOps world and I am always looking for new challenges. . I have experience in Docker, Kubernetes, Jenkins, Gitlab CI, Github Actions, etc.',
    icon: () => (
      <FontAwesomeIcon icon={faJenkins} size="2x" />
    )
  },
  {
    name: 'Cloud',
    description:
    'Appasionate about the Cloud. I have experience in AWS, Azure, Google Cloud, Digital Ocean, etc.',
    icon: () => (
      <FontAwesomeIcon icon={faCloud} size="2x" />
    )
  },
  {
    name: 'Databases',
    description:
    'with more than 15 years using the most popular relational databases such as MySQL, PostgreSQL, Oracle and SQLServer. The NoSQL databases I have used MondoDB, Redis, DynamoDB and Cassandra.',
    icon: () => (
      <FontAwesomeIcon icon={faDatabase} size="2x" />
    )
  }
]

export default function Skill() {
  return (
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
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 text-white">
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
  )
}
