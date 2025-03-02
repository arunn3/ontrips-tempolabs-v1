import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";

interface PublicPrivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (isPublic: boolean) => void;
}

const PublicPrivateDialog: React.FC<PublicPrivateDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [isPublic, setIsPublic] = React.useState(true);

  const handleConfirm = () => {
    onConfirm(isPublic);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Itinerary Visibility</DialogTitle>
          <DialogDescription>
            Choose whether to make your itinerary public or private.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            defaultValue="public"
            value={isPublic ? "public" : "private"}
            onValueChange={(value) => setIsPublic(value === "public")}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="public" id="public" />
              <div className="grid gap-1.5">
                <Label htmlFor="public" className="font-medium">
                  Public
                </Label>
                <p className="text-sm text-muted-foreground">
                  Your itinerary will be visible to other users and can be used
                  as a template.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="private" id="private" />
              <div className="grid gap-1.5">
                <Label htmlFor="private" className="font-medium">
                  Private
                </Label>
                <p className="text-sm text-muted-foreground">
                  Your itinerary will only be visible to you.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublicPrivateDialog;
