import React from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";

interface DatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDateSelect: (date: Date) => void;
}

const DatePickerDialog: React.FC<DatePickerDialogProps> = ({
  open,
  onOpenChange,
  onDateSelect,
}) => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const handleConfirm = () => {
    if (date) {
      onDateSelect(date);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Travel Start Date</DialogTitle>
          <DialogDescription>
            Choose the first day of your trip. Your itinerary will be generated
            starting from this date.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            className="mx-auto"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm {date && `(${format(date, "PPP")})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DatePickerDialog;
