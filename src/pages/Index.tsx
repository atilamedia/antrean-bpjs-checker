
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import DatePicker from '@/components/DatePicker';
import QueueList from '@/components/QueueList';
import Header from '@/components/Header';
import { fetchQueueByDate, BpjsQueueItem } from '@/services/bpjsApi';
import { format } from 'date-fns';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [queueItems, setQueueItems] = useState<BpjsQueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchQueueData = async (date: string) => {
    setLoading(true);
    try {
      const data = await fetchQueueByDate(date);
      setQueueItems(data.response.list);
      
      if (data.response.list.length === 0) {
        toast({
          title: "Informasi",
          description: "Tidak ada antrean pada tanggal yang dipilih",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error fetching queue data:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data antrean. Silakan coba lagi.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Header />
        
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <DatePicker onDateChange={handleDateChange} />
          
          <QueueList queueItems={queueItems} loading={loading} />
        </div>
        
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>© 2025 Antrean BPJS Checker</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
