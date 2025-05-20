import Image from 'next/image';
import Button from '../ui/Button';
import Container from '../ui/Container';

const Hero = () => {
  return (
    <section className="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Learn smarter with <span className="text-blue-600 dark:text-blue-400">free</span> AI tutoring
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
              Tutortron helps students master concepts faster with adaptive lessons, real-time feedback, and personalized learning experiences – at no cost.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button href="/signup" size="lg">
                Sign up for free
              </Button>
              <Button variant="secondary" href="#how-it-works" size="lg">
                See how it works
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-12">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Trusted by educators and students from:
              </p>
              <div className="flex flex-wrap gap-6 items-center">
                <div className="text-gray-400 dark:text-gray-500 font-semibold">Stanford University</div>
                <div className="text-gray-400 dark:text-gray-500 font-semibold">MIT</div>
                <div className="text-gray-400 dark:text-gray-500 font-semibold">Harvard</div>
                <div className="text-gray-400 dark:text-gray-500 font-semibold">Oxford</div>
              </div>
            </div>
          </div>
          
          {/* Hero image */}
          <div className="relative h-[400px] lg:h-[500px] rounded-xl overflow-hidden shadow-xl">
            {/* Placeholder for actual hero image */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-white text-center px-6">
                <div className="text-2xl font-bold mb-4">Tutortron Interface</div>
                <p>Interactive AI tutoring dashboard with personalized lessons and real-time feedback</p>
                {/* Replace this with your actual screenshot or illustration */}
                {/* <Image 
                  src="/images/hero-screenshot.png" 
                  alt="Tutortron interface showing a personalized learning session" 
                  fill 
                  className="object-cover"
                /> */}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;