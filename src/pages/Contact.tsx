// src/pages/Contact.tsx
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const Contact = () => {
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    // Extract form data
    const formData = {
      firstName: (e.currentTarget.elements.namedItem('firstName') as HTMLInputElement)?.value,
      lastName: (e.currentTarget.elements.namedItem('lastName') as HTMLInputElement)?.value,
      email: (e.currentTarget.elements.namedItem('email') as HTMLInputElement)?.value,
      phone: (e.currentTarget.elements.namedItem('phone') as HTMLInputElement)?.value,
      subject: (e.currentTarget.elements.namedItem('subject') as HTMLInputElement)?.value,
      message: (e.currentTarget.elements.namedItem('message') as HTMLTextAreaElement)?.value,
    };

    try {
      // Send data to the API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatusMessage('Your message has been sent successfully!');
        e.currentTarget.reset(); // Reset the form
      } else {
        const errorData = await response.json();
        setStatusMessage(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      setStatusMessage('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ... (Hero and Contact Info sections remain the same) ... */}
      <section className="bg-gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Get in touch with our automotive experts for personalized assistance
          </p>
        </div>
      </section>

      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="space-y-8">
              {/* ... (Your existing contact info cards) ... */}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {statusMessage && (
                    <div className={`mb-4 p-3 rounded ${statusMessage.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {statusMessage}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" name="firstName" placeholder="Enter your first name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" name="lastName" placeholder="Enter your last name" required />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="Enter your email" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="Enter your phone number" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" name="subject" placeholder="What can we help you with?" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us about your vehicle, the part you need, or any questions you have..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* ... (Map Placeholder section remains the same) ... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;