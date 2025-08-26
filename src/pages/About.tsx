import { Users, Award, Truck, Wrench, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  const stats = [
    { label: "Years in Business", value: "14+", icon: Award },
    { label: "Happy Customers", value: "50K+", icon: Users },
    { label: "Parts in Stock", value: "100K+", icon: Wrench },
    { label: "Orders Shipped Daily", value: "500+", icon: Truck }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About AutoParts Pro</h1>
          <p className="text-xl max-w-3xl mx-auto text-gray-200">
            Your trusted partner for premium automotive parts and accessories since 2010
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center transition-transform hover:scale-105 duration-300">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Story</h2>
              <p className="text-muted-foreground text-lg">
                Built by automotive enthusiasts, for automotive enthusiasts
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold mb-4">Founded on Quality</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  AutoParts Pro was founded in 2010 by a team of automotive professionals who 
                  were frustrated with the lack of quality parts and reliable service in the market. 
                  We set out to create a company that would put quality first and build lasting 
                  relationships with our customers.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Today, we're proud to serve over 50,000 customers nationwide, from professional 
                  mechanics to weekend DIY enthusiasts. Our commitment to quality, competitive 
                  pricing, and exceptional customer service remains unchanged.
                </p>
              </div>
              <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Wrench className="h-24 w-24 mx-auto mb-4" />
                  <p>Company Image Placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Quality First</h3>
                <p className="text-muted-foreground">
                  We source only the highest quality parts from trusted manufacturers 
                  and back everything with our guarantee.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Customer Focus</h3>
                <p className="text-muted-foreground">
                  Your success is our success. We're here to help you find the right 
                  parts and get back on the road quickly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Fast & Reliable</h3>
                <p className="text-muted-foreground">
                  Quick shipping, accurate orders, and reliable delivery so you 
                  can get your vehicle back in service fast.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground text-lg">
              Automotive experts dedicated to serving you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { name: "Mike Johnson", role: "Founder & CEO", experience: "25+ years automotive" },
              { name: "Sarah Chen", role: "Head of Customer Service", experience: "15+ years support" },
              { name: "David Rodriguez", role: "Parts Specialist", experience: "20+ years parts" }
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="h-16 w-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                <p className="text-primary font-medium mb-1">{member.role}</p>
                <p className="text-muted-foreground text-sm">{member.experience}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;