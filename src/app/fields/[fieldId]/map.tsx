
'use client';

import * as React from 'react';
import 'leaflet/dist/leaflet.css';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';

// Leaflet's icon URLs don't work well with bundlers, so we manually fix them.
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconRetinaUrl: iconRetinaUrl.src,
    iconUrl: iconUrl.src,
    shadowUrl: shadowUrl.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FieldMapProps {
    center: LatLngExpression;
    popupText: string;
}

export default function FieldMap({ center, popupText }: FieldMapProps) {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // Return a placeholder or null until the component is mounted on the client
    if (!isMounted) {
        return <div className="h-full w-full bg-muted animate-pulse rounded-lg" />;
    }

    // Must dynamically import react-leaflet components only on the client
    const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
    
    return (
        <MapContainer center={center} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={center}>
                <Popup>{popupText}</Popup>
            </Marker>
        </MapContainer>
    );
}
