export default function Landing() {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
          <header className="flex justify-between items-center px-6 py-4 shadow-md">
            <h1 className="text-2xl font-bold">HomeKitchen</h1>
            <nav className="space-x-4">
              <a href="/login" className="hover:text-green-600">Login</a>
              <a href="/signup" className="hover:text-green-600">Sign Up</a>
            </nav>
          </header>
          
          {/* Hero Section */}
          <section className="relative flex flex-col items-center justify-center text-center px-6 py-30">
            {/* Background Image */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center" 
              style={{
                backgroundImage: "url('/images/landing_bg.jpg')", 
                backgroundPosition: "center",
                filter: "brightness(0.7) blur(3px)"
              }}
            ></div>

            {/* Content with improved contrast */}
                  <div className="relative z-10">
                    <h2 className="text-4xl text-white font-bold mb-4">Delicious Homemade Meals. <br className="hidden sm:block" /> Delivered to You.</h2>
                    <p className="text-lg text-gray-300 max-w-xl mb-6">
                    Support local home chefs. Discover unique flavors around your neighborhood.
                    </p>
                    <input
                    type="text"
                    placeholder="Search by cuisine, dish, or kitchen name"
                    className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-md mb-4 bg-white text-gray-800"
                    />
                    <button className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700">Search here</button>
                    
                  </div>
                  </section>

                  {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-16 bg-white text-center">
          <div>
            <h3 className="text-xl text-black font-semibold mb-2">📦 Easy Ordering</h3>
            <p className="text-gray-600">
              Browse menus from real home kitchens and order in minutes.
            </p>
          </div>
          <div>
            <h3 className="text-xl text-black font-semibold mb-2">👩‍🍳 Support Local Chefs</h3>
            <p className="text-gray-600">
              Help independent cooks grow their passion into a business.
            </p>
          </div>
          <div>
            <h3 className="text-xl text-black font-semibold mb-2">📍 Local, Authentic, Fresh</h3>
            <p className="text-gray-600">
              Meals made with love, delivered from kitchens near you.
            </p>
          </div>
        </section>
  
        {/* CTA Section */}
        <section className="bg-green-600 text-white text-center px-6 py-16">
          <h2 className="text-3xl font-semibold mb-4">Are you a Home Chef?</h2>
          <p className="mb-6">Join the platform and reach customers in your neighborhood.</p>
          <button className="bg-white text-green-600 px-6 py-3 rounded-md font-medium hover:bg-gray-100">
            Join the Platform
          </button>
        </section>
  
        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 py-6 bg-gray-100">
          &copy; 2025 HomeKitchen. All rights reserved.
        </footer>
      </div>
    );
  }
  