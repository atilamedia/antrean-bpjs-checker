
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface DatePickerProps {
  onDateChange: (date: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ onDateChange }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      // Format date to YYYY-MM-DD format for API
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      onDateChange(formattedDate);
    }
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col space-y-2 w-full max-w-sm">
      <label className="text-sm font-medium text-gray-700">Pilih Tanggal Antrean</label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-start text-left font-normal bg-white hover:bg-gray-50 border-gray-300 ${!date && "text-gray-500"}`}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-medical-blue" />
            {date ? (
              format(date, 'EEEE, dd MMMM yyyy', { locale: id })
            ) : (
              <span>Pilih tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            locale={id}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
