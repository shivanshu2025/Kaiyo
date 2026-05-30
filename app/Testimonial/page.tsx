import {
  Star,
} from "lucide-react";

export default function TestimonialsPage() {
  const testimonials = [
    {
      id: 1,
      name: "Rahul Sharma",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 5,
      message:
        "A seamless experience with amazing customer support. Highly satisfied.",
    },
    {
      id: 2,
      name: "Priya Singh",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 4,
      message:
        "A seamless experience with amazing customer support. Highly satisfied.",
    },
    {
      id: 3,
      name: "Amit Kumar",
      image: "https://randomuser.me/api/portraits/men/68.jpg",
      rating: 4,
      message:
        "A seamless experience with amazing customer support. Highly satisfied.",
    },
    {
      id: 4,
      name: "Sneha Verma",
      image: "https://randomuser.me/api/portraits/women/65.jpg",
      rating: 5,
      message:
        "A seamless experience with amazing customer support. Highly satisfied.",
    },
  ];

  return (
    <div className="bg-[#E9E9E7] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Left Content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-gray-900">
              <span className="text-[#2f4f3f]">See Why</span> Patients Love
              <br />
              Telecom.
            </h1>

            <p className="mt-8 text-lg text-gray-600 max-w-xl leading-relaxed">
              Check out what others are saying about us or leave your
              feedback. Your reviews help us grow and improve every step
              of the way. Join thousands of happy clients who trust us.
              Don’t just take our word for it—read their reviews now.
            </p>
          </div>

          {/* Illustration */}
          <div className="flex justify-center">
          <img src="/images/download.png" alt="" />
          </div>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-2 gap-16">
          {testimonials.map((item) => (
            <div key={item.id} className="relative">
              {/* Floating Avatar */}
              <div className="absolute -top-8 right-8 z-10">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-xl object-cover"
                />
              </div>

              {/* Card */}
              <div className="bg-white rounded-[30px] shadow-md pt-10 pb-8 px-6 min-h-[220px]">
                {/* Name Badge */}
                <div className="inline-flex items-center bg-[#2f4f3f] text-white px-8 py-4 rounded-full font-semibold text-lg mb-5">
                  {item.name}
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      size={22}
                      fill={
                        index < item.rating
                          ? "#FACC15"
                          : "transparent"
                      }
                      className={
                        index < item.rating
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="border-l-4 border-[#2f4f3f] pl-4">
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trusted by Thousands of Happy Patients
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto">
            We value every review and continuously strive to provide
            exceptional service and support for our community.
          </p>

          <button className="mt-8 bg-[#2f4f3f] hover:bg-[#63776d] text-white px-8 py-4 rounded-full font-semibold transition">
            Leave Your Feedback
          </button>
        </div>
      </div>
    </div>
  );
}