import Container from '../ui/Container';

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Create your account',
      description: 'Sign up for free.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      number: '02',
      title: 'Start learning',
      description: 'Connect to Avenue to Learn or upload your own materials to get personalized learning recommendations.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      )
    },
    {
      number: '03',
      title: 'Interactive sessions',
      description: 'Engage with our AI tutor, complete exercises, and get instant feedback that adapts to your progress.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
      )
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How Tutortron works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Our free AI-powered platform makes learning intuitive and effective for all students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <div className="flex flex-col items-center md:items-start">
                <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {step.icon}
                </div>
                <div className="text-4xl font-extrabold text-gray-200 dark:text-gray-800 absolute top-0 -left-2 md:left-12 opacity-50">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2 mt-2 text-center md:text-left">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center md:text-left">{step.description}</p>
              </div>
              
              {/* Connector lines between steps (visible on desktop) */}
              {step.number !== '03' && (
                <div className="hidden lg:block absolute top-10 left-full w-12 h-0.5 bg-gray-200 dark:bg-gray-800 -mx-6" />
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default HowItWorks;