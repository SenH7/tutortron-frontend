import Button from '../ui/Button';

const CTASection = () => {
  return (
    <section id="cta" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to transform your learning experience?
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-blue-100">
          Join thousands of students who are achieving their academic goals with Tutortron.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            href="/signup" 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            Get started for free
          </Button>
          <Button 
            href="/contact" 
            variant="secondary" 
            size="lg" 
            className="border-white text-white hover:bg-white/10"
          >
            Contact our team
          </Button>
        </div>
        <p className="mt-6 text-sm text-blue-100">
          No credit card required. Start with a free 14-day trial.
        </p>
      </div>
    </section>
  );
};

export default CTASection;