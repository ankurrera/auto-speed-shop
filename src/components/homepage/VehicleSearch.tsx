import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VehicleSearchProps {
  onSearch?: (year: string, make: string, model: string) => void;
}

const VehicleSearch = ({ onSearch }: VehicleSearchProps) => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const navigate = useNavigate();

  // Sample data - in a real app, this would come from an API
  const years = Array.from({ length: 30 }, (_, i) => (2024 - i).toString());
  const makes = ["Audi", "BMW", "Chevrolet", "Ford", "Honda", "Mazda", "Mercedes", "Nissan", "Subaru", "Toyota"];
  const models = ["Sedan", "SUV", "Hatchback", "Coupe", "Convertible", "Truck", "Wagon"];

  const handleSearch = () => {
    if (onSearch) {
      onSearch(selectedYear, selectedMake, selectedModel);
    } else {
      // Default navigation to shop with search params
      const params = new URLSearchParams();
      if (selectedYear) params.set('year', selectedYear);
      if (selectedMake) params.set('make', selectedMake);
      if (selectedModel) params.set('model', selectedModel);
      navigate(`/shop?${params.toString()}`);
    }
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Find the Perfect Fit
            </h2>
            <p className="text-lg text-muted-foreground">
              Select your vehicle details to discover compatible parts
            </p>
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Year Selector */}
              <div className="space-y-2">
                <label htmlFor="year-select" className="text-sm font-medium text-foreground block">
                  Year
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year-select" className="h-12 border-border">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Make Selector */}
              <div className="space-y-2">
                <label htmlFor="make-select" className="text-sm font-medium text-foreground block">
                  Make
                </label>
                <Select value={selectedMake} onValueChange={setSelectedMake}>
                  <SelectTrigger id="make-select" className="h-12 border-border">
                    <SelectValue placeholder="Select Make" />
                  </SelectTrigger>
                  <SelectContent>
                    {makes.map(make => (
                      <SelectItem key={make} value={make}>
                        {make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model Selector */}
              <div className="space-y-2">
                <label htmlFor="model-select" className="text-sm font-medium text-foreground block">
                  Model
                </label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger id="model-select" className="h-12 border-border">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-transparent block">
                  Search
                </label>
                <Button 
                  onClick={handleSearch}
                  size="lg" 
                  className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold transition-all duration-300"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search Parts
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VehicleSearch;