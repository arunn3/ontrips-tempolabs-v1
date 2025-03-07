import React from "react";
import ChatInterface from "./ChatInterface";
import ScheduleView from "./ScheduleView";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Calendar, Menu, User } from "lucide-react";
import AuthModal from "./auth/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

interface HomeProps {
  onMenuClick?: () => void;
}

const Home = ({ onMenuClick = () => {} }: HomeProps) => {
  const [showChat, setShowChat] = React.useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="text-xl font-semibold">
              SagaScout
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(!showChat)}
            >
              {showChat ? "Hide Chat" : "Show Chat"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Calendar className="w-4 h-4 mr-2" />
              Explore Destinations
            </Button>
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-6 h-[calc(100vh-120px)]">
          {/* Schedule View */}
          <div className="flex-1">
            <ScrollArea className="h-full">
              <ScheduleView />
            </ScrollArea>
          </div>

          {/* Chat Interface */}
          {showChat && (
            <div className="w-[400px]">
              <ScrollArea className="h-full">
                <ChatInterface />
              </ScrollArea>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
