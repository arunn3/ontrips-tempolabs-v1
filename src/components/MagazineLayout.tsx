import React from "react";
import { Button } from "./ui/button";
import { Menu, User, Search } from "lucide-react";
import { Input } from "./ui/input";
import AuthModal from "./auth/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

interface MagazineLayoutProps {
  children: React.ReactNode;
}

const MagazineLayout: React.FC<MagazineLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
              <Link to="/" className="text-xl font-semibold">
                SagaScout
              </Link>
            </div>

            <div className="hidden md:flex items-center relative max-w-md w-full mx-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search destinations..."
                className="pl-10 bg-gray-50"
              />
            </div>

            <div className="flex items-center gap-3">
              <Link to="/planner">
                <Button variant="outline" size="sm">
                  Planner
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="sm">
                  Explore
                </Button>
              </Link>
              <AuthModal
                trigger={
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {user ? "Profile" : "Sign In"}
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">SagaScout</h3>
              <p className="text-sm text-gray-600">
                Your AI-powered travel companion for creating personalized
                itineraries and exploring new destinations.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-3">Features</h4>
              <ul className="space-y-2 text-sm">
                <li>Personalized Itineraries</li>
                <li>Destination Discovery</li>
                <li>Interactive Maps</li>
                <li>Daily Schedules</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>Travel Guides</li>
                <li>Destination Tips</li>
                <li>Travel Blog</li>
                <li>Community</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} SagaScout. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MagazineLayout;
