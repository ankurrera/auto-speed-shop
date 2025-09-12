import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScreenshotModalViewerProps {
  screenshotUrl: string;
  transactionId: string;
  alt?: string;
  triggerClassName?: string;
}

export const ScreenshotModalViewer = ({ 
  screenshotUrl, 
  transactionId, 
  alt = "Payment Screenshot",
  triggerClassName = ""
}: ScreenshotModalViewerProps) => {
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(screenshotUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch screenshot');
      }
      
      const blob = await response.blob();
      
      // Determine file extension from the blob type or URL
      let extension = 'png';
      if (blob.type.includes('jpeg') || blob.type.includes('jpg')) {
        extension = 'jpg';
      } else if (blob.type.includes('png')) {
        extension = 'png';
      } else if (screenshotUrl.includes('.jpg') || screenshotUrl.includes('.jpeg')) {
        extension = 'jpg';
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${transactionId}.${extension}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: `Screenshot saved as ${transactionId}.${extension}`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download screenshot. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClassName}>
          <Eye className="h-4 w-4 mr-2" />
          View Screenshot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Payment Screenshot</DialogTitle>
          <DialogDescription>
            Transaction ID: {transactionId}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-muted/50 max-h-[60vh]">
            {!imageError ? (
              <img
                src={screenshotUrl}
                alt={alt}
                className="w-full h-auto max-h-[60vh] object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>Unable to load screenshot</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => window.open(screenshotUrl, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};