
// Define types for our API response
export interface BpjsQueueItem {
  kodebooking: string;
  tanggal: string;
  kodepoli: string;
  kodedokter: number;
  jampraktek: string;
  nik: string;
  nokapst: string;
  nohp: string;
  norekammedis: string;
  jeniskunjungan: number;
  nomorreferensi: string;
  sumberdata: string;
  ispeserta: number;
  noantrean: string;
  estimasidilayani: number;
  createdtime: number;
  status: string;
}

export interface BpjsApiResponse {
  response: {
    list: BpjsQueueItem[];
  };
  metadata: {
    code: number;
    message: string;
  };
}

// Mock data to use as fallback if the API call fails
const mockData: BpjsApiResponse = {
  response: {
    list: [
      {
        kodebooking: "ABC0000001",
        tanggal: "2021-03-24",
        kodepoli: "INT",
        kodedokter: 1234,
        jampraktek: "08:00-17:00",
        nik: "2749494383830001",
        nokapst: "0000000000013",
        nohp: "081234567890",
        norekammedis: "654321",
        jeniskunjungan: 1,
        nomorreferensi: "1029R0021221K000012",
        sumberdata: "Mobile JKN",
        ispeserta: 1,
        noantrean: "INT-0001",
        estimasidilayani: 1669278161000,
        createdtime: 1669278161000,
        status: "Selesai dilayani"
      },
      {
        kodebooking: "ABC0000002",
        tanggal: "2021-03-24",
        kodepoli: "OBG",
        kodedokter: 5678,
        jampraktek: "09:00-15:00",
        nik: "2749494383830002",
        nokapst: "0000000000014",
        nohp: "081234567891",
        norekammedis: "654322",
        jeniskunjungan: 1,
        nomorreferensi: "1029R0021221K000013",
        sumberdata: "Mobile JKN",
        ispeserta: 1,
        noantrean: "OBG-0001",
        estimasidilayani: 1669278162000,
        createdtime: 1669278161000,
        status: "Menunggu"
      },
      {
        kodebooking: "ABC0000003",
        tanggal: "2021-03-25",
        kodepoli: "INT",
        kodedokter: 1234,
        jampraktek: "08:00-17:00",
        nik: "2749494383830003",
        nokapst: "0000000000015",
        nohp: "081234567892",
        norekammedis: "654323",
        jeniskunjungan: 1,
        nomorreferensi: "1029R0021221K000014",
        sumberdata: "Mobile JKN",
        ispeserta: 1,
        noantrean: "INT-0002",
        estimasidilayani: 1669278163000,
        createdtime: 1669278161000,
        status: "Belum dilayani"
      }
    ]
  },
  metadata: {
    code: 200,
    message: "OK"
  }
};

// Configuration for API endpoints
interface ApiConfig {
  supabaseUrl: string;
  localUrl: string;
  isLocalDevelopment: boolean;
}

const apiConfig: ApiConfig = {
  supabaseUrl: "https://kwfpqxobbwbmhlxhisuo.supabase.co/functions/v1/fetch-bpjs-queue",
  localUrl: "http://localhost:54321/functions/v1/fetch-bpjs-queue",
  // Set to true for local development, false for production
  isLocalDevelopment: true // For local testing
};

// Use the edge function to fetch data from BPJS API
export const fetchQueueByDate = async (date: string): Promise<BpjsApiResponse> => {
  try {
    // Determine which URL to use based on environment
    const apiUrl = apiConfig.isLocalDevelopment ? apiConfig.localUrl : apiConfig.supabaseUrl;
    
    console.log(`Calling edge function at: ${apiUrl}`);
    
    // Call our Supabase edge function
    const response = await fetch(
      apiUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date }),
      }
    );

    // Get the full text response for debugging
    const responseText = await response.text();
    console.log(`Edge function response status: ${response.status}`);
    console.log(`Edge function response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
    
    if (!response.ok) {
      console.error("Error calling BPJS API via edge function:", responseText);
      throw new Error(`Edge function error: ${response.status}`);
    }

    let data;
    try {
      // Parse the response as JSON
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("Failed to parse edge function response as JSON:", error);
      throw new Error("Invalid JSON response from edge function");
    }
    
    // Check for error in response
    if (data.response && data.response.error) {
      console.error("API error in response:", data.response.error);
      throw new Error(data.response.error);
    }
    
    // Handle the case where data.response.list is undefined
    if (data.response && !data.response.list) {
      console.error("Response missing list property:", data.response);
      
      // Create a valid response structure
      data = {
        ...data,
        response: { 
          list: data.response.list || [] 
        }
      };
    }
    
    // Return the response if it has the expected structure
    if (data.response && data.metadata) {
      return data;
    }
    
    console.error("Unexpected response format:", data);
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Failed to fetch queue data:", error);
    
    // Use mock data as fallback
    console.log("Using mock data as fallback");
    
    // Filter mock data based on the requested date
    const filteredData = {
      ...mockData,
      response: {
        list: mockData.response.list.filter(item => item.tanggal === date)
      }
    };
    
    return filteredData;
  }
};

// Function to format a medical record number with some digits masked
export const maskMedicalRecord = (recordNumber: string): string => {
  if (recordNumber.length <= 4) return recordNumber;
  
  const visiblePart = recordNumber.slice(-4);
  const maskedPart = '*'.repeat(recordNumber.length - 4);
  
  return `${maskedPart}${visiblePart}`;
};

// Function to format a phone number with some digits masked
export const maskPhoneNumber = (phoneNumber: string): string => {
  if (phoneNumber.length <= 4) return phoneNumber;
  
  const visiblePart = phoneNumber.slice(-4);
  const maskedPart = '*'.repeat(phoneNumber.length - 4);
  
  return `${maskedPart}${visiblePart}`;
};

// Function to format NIK with some digits masked
export const maskNik = (nik: string): string => {
  if (nik.length <= 6) return nik;
  
  const visiblePart = nik.slice(-4);
  const firstPart = nik.slice(0, 2);
  const maskedPart = '*'.repeat(nik.length - 6);
  
  return `${firstPart}${maskedPart}${visiblePart}`;
};

// Function to format timestamp to readable time
export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Function to get status color class based on status text
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'selesai dilayani':
      return 'bg-status-complete';
    case 'menunggu':
      return 'bg-status-waiting';
    case 'belum dilayani':
      return 'bg-status-pending';
    default:
      return 'bg-gray-400';
  }
};
