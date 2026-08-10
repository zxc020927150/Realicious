declare module 'use-tw-zipcode' {
  export const cities: string[];
  export const districts: Record<string, string[]>;
  export const zipcodes: Record<string, Record<string, string>>;

  export interface UseTwZipCodeReturn {
    city: string;
    district: string;
    zipCode: string;
    handleCityChange: (city: string) => void;
    handleDistrictChange: (district: string) => void;
    setCity: (city: string) => void;
    setDistrict: (district: string) => void;
    setZipCode: (zipCode: string) => void;
  }

  export function useTwZipCode(
    initialCity?: string,
    initialDistrict?: string
  ): UseTwZipCodeReturn;
}