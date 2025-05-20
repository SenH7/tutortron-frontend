import Card from '../ui/Card';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Tutortron helped me understand calculus when nothing else was working. The personalized approach made all the difference.",
      author: "Alex Johnson",
      role: "College Student",
      image: null // Replace with actual image path when available
    },
    {
      quote: "As a teacher, I appreciate how Tutortron supplements my classroom instruction. My students are more engaged and showing better results.",
      author: "Sarah Williams",
      role: "High School Teacher",
      image: null // Replace with actual image path when available
    },
    {
      quote: "My daughter was struggling with physics, but after using Tutortron, she's gained confidence and improved her grades substantially.",
      author: "Michael Chen",
      role: "Parent",
      image: null // Replace with actual image path when available
    }
  ];

  return (
    <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What our users are saying
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Join thousands of students and educators who are transforming their learning experience with Tutortron.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="flex flex-col p-8">
              <div className="mb-6">
                <svg width="45" height="36" className="text-gray-300 dark:text-gray-700" viewBox="0 0 45 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.4 36C9.4 36 6.2 34.6 3.8 31.8C1.4 29 0.2 25.6 0.2 21.6C0.2 17.2 1.8 12.9 5 8.7C8.2 4.5 12.6 1.5 18.2 -0.5L20 3.5C15.6 5.5 12.4 7.9 10.4 10.7C8.4 13.5 7.6 16.4 8 19.4C8.4 19 9.2 18.8 10.4 18.8C12.6 18.8 14.4 19.6 15.8 21.2C17.2 22.8 17.9 24.8 17.9 27.2C17.9 29.6 17.1 31.6 15.5 33.2C13.9 34.8 11.8 36 13.4 36ZM37.4 36C33.4 36 30.2 34.6 27.8 31.8C25.4 29 24.2 25.6 24.2 21.6C24.2 17.2 25.8 12.9 29 8.7C32.2 4.5 36.6 1.5 42.2 -0.5L44 3.5C39.6 5.5 36.4 7.9 34.4 10.7C32.4 13.5 31.6 16.4 32 19.4C32.4 19 33.2 18.8 34.4 18.8C36.6 18.8 38.4 19.6 39.8 21.2C41.2 22.8 41.9 24.8 41.9 27.2C41.9 29.6 41.1 31.6 39.5 33.2C37.9 34.8 35.8 36 37.4 36Z" fill="currentColor"/>
                </svg>
              </div>
              <p className="text-lg mb-6 flex-grow">{testimonial.quote}</p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 mr-4">
                  {testimonial.image ? (
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.author} 
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">
                      {testimonial.author.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">{testimonial.author}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;