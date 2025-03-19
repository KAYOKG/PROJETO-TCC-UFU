import React, { useEffect } from 'react';
import { useGeolocated } from 'react-geolocated';
import { useLogStore } from '../store/useLogStore';
import { publicIp } from 'public-ip';

export const GeolocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
    },
    watchPosition: true,
    userDecisionTimeout: 5000,
  });

  const updateGeolocation = useLogStore(state => state.updateGeolocation);
  const updateIpAddress = useLogStore(state => state.updateIpAddress);

  useEffect(() => {
    if (coords) {
      updateGeolocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    }
  }, [coords, updateGeolocation]);

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const ip = await publicIp();
        updateIpAddress(ip);
      } catch (error) {
        console.warn('Failed to fetch IP address:', error);
        updateIpAddress('Não disponível');
      }
    };

    fetchIp();
  }, [updateIpAddress]);

  if (!isGeolocationAvailable) {
    console.warn('Geolocation is not supported by your browser');
  }

  if (!isGeolocationEnabled) {
    console.warn('Geolocation permissions not granted');
  }

  return <>{children}</>;
};