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

export const ItineraryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
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

  return (
    <ItineraryContext.Provider
      value={{
        itinerary,
        setItinerary,
        isGenerating,
        setIsGenerating,
        generationProgress,
        setGenerationProgress,
      }}
    >
      {children}
    </ItineraryContext.Provider>
  );
};

export const useItinerary = () => {
  const context = useContext(ItineraryContext);
  if (context === undefined) {
    throw new Error("useItinerary must be used within an ItineraryProvider");
  }
  return context;
};
