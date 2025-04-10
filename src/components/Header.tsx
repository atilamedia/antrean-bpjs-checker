
import React from 'react';
import { CalendarCheck } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="py-6">
      <div className="flex items-center justify-center">
        <CalendarCheck className="h-8 w-8 text-medical-blue" />
        <h1 className="text-2xl md:text-3xl font-bold ml-2 text-gray-800">Antrean BPJS Checker</h1>
      </div>
      <p className="text-center mt-2 text-gray-600 max-w-md mx-auto">
        Periksa status antrean layanan BPJS Kesehatan berdasarkan tanggal kunjungan
      </p>
    </header>
  );
};

export default Header;
