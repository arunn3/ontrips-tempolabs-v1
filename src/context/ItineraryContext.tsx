import React, { createContext, useContext, useState, useEffect } from "react";

interface ItineraryContextType {
  itinerary: any | null;
  setItinerary: (itinerary: any) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  generationProgress: number;
  setGenerationProgress: (progress: number) => void;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(
  undefined,
);

// Using function declaration for consistent component exports
export const ItineraryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [itinerary, setItinerary] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Load itinerary from localStorage on initial render
  useEffect(() => {
    try {
      const storedItinerary = localStorage.getItem("generatedItinerary");
      if (storedItinerary) {
        setItinerary(JSON.parse(storedItinerary));
      }
    } catch (error) {
      console.error("Error loading itinerary from localStorage:", error);
    }
  }, []);

  const contextValue = {
    itinerary,
    setItinerary,
    isGenerating,
    setIsGenerating,
    generationProgress,
    setGenerationProgress,
  };

  return (
    <ItineraryContext.Provider value={contextValue}>
      {children}
    </ItineraryContext.Provider>
  );
};

// Using arrow function for consistent hook exports
export const useItinerary = () => {
  const context = useContext(ItineraryContext);
  if (context === undefined) {
    throw new Error("useItinerary must be used within an ItineraryProvider");
  }
  return context;
};
