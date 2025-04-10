
import React from 'react';
import { BpjsQueueItem, formatTime, maskMedicalRecord, maskNik, maskPhoneNumber, getStatusColor } from '@/services/bpjsApi';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface QueueListProps {
  queueItems: BpjsQueueItem[];
  loading: boolean;
}

const QueueList: React.FC<QueueListProps> = ({ queueItems, loading }) => {
  if (loading) {
    return <QueueSkeleton />;
  }

  if (queueItems.length === 0) {
    return (
      <div className="mt-8 text-center p-8 bg-medical-gray rounded-lg">
        <p className="text-gray-600">Tidak ada antrean pada tanggal yang dipilih</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <h2 className="font-semibold text-lg">Daftar Antrean ({queueItems.length})</h2>
      {queueItems.map((item) => (
        <Card key={item.kodebooking} className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-medical-lightBlue flex items-center justify-center">
                  <span className="font-semibold text-medical-blue">{item.kodepoli}</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-lg">{item.noantrean}</h3>
                  <p className="text-sm text-gray-600">Booking ID: {item.kodebooking}</p>
                </div>
              </div>
              
              <div className={`mt-2 md:mt-0 px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(item.status)}`}>
                {item.status}
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Jam Praktik</p>
                <p className="font-medium">{item.jampraktek}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Estimasi Dilayani</p>
                <p className="font-medium">{formatTime(item.estimasidilayani)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Kode Dokter</p>
                <p className="font-medium">{item.kodedokter}</p>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-medical-gray p-3 rounded-md">
              <div>
                <p className="text-xs text-gray-500">NIK</p>
                <p className="font-medium">{maskNik(item.nik)}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">No. Rekam Medis</p>
                <p className="font-medium">{maskMedicalRecord(item.norekammedis)}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">No. HP</p>
                <p className="font-medium">{maskPhoneNumber(item.nohp)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Skeleton loader for the queue items
const QueueSkeleton: React.FC = () => {
  return (
    <div className="mt-6 space-y-4">
      <h2 className="font-semibold text-lg">Daftar Antrean</h2>
      {[1, 2].map((item) => (
        <Card key={item} className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse-subtle"></div>
                <div className="ml-4">
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse-subtle"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded mt-1 animate-pulse-subtle"></div>
                </div>
              </div>
              
              <div className="mt-2 md:mt-0 h-6 w-24 bg-gray-200 rounded-full animate-pulse-subtle"></div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse-subtle"></div>
                  <div className="h-5 w-24 bg-gray-200 rounded mt-1 animate-pulse-subtle"></div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-100 p-3 rounded-md">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-2 w-16 bg-gray-200 rounded animate-pulse-subtle"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded mt-1 animate-pulse-subtle"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QueueList;
