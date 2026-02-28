"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix weird Next.js Leaflet icon bug
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to dynamically update the map view when props change
function MapUpdater({ center, zoom }: { center: { lat: number, lng: number }, zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([center.lat, center.lng], zoom, { animate: true });
    }, [center, zoom, map]);
    return null;
}

interface LeafletMapProps {
    center: { lat: number, lng: number };
    zoom: number;
    zones: any[];
    searchQuery: string;
    mockPolygons: Record<string, { lat: number, lng: number }[]>;
    getPolygonColor: (zone: any) => string;
    handleZoneClick: (zone: any) => void;
    mapViewToggle: 'risk' | 'density';
    heatmapPoints: { lat: number, lng: number }[];
}

export default function LeafletMap({
    center, zoom, zones, searchQuery, mockPolygons, getPolygonColor, handleZoneClick, mapViewToggle, heatmapPoints
}: LeafletMapProps) {

    // Simple pseudo-heatmap using semi-transparent circle markers for Leaflet MVP
    const renderDensity = () => {
        return heatmapPoints.map((point, i) => (
            <CircleMarker
                key={`heat-${i}`}
                center={[point.lat, point.lng]}
                radius={20}
                pathOptions={{
                    fillColor: '#ef4444',
                    fillOpacity: 0.2,
                    stroke: false
                }}
            />
        ));
    };

    return (
        <MapContainer
            center={[center.lat, center.lng]}
            zoom={zoom}
            style={{ width: '100%', height: '100%', borderRadius: '12px' }}
            zoomControl={true}
        >
            <MapUpdater center={center} zoom={zoom} />

            {/* Dark themed tiles */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {mapViewToggle === 'density' && renderDensity()}

            {zones.filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase())).map((zone, i) => {
                const polyCoords = mockPolygons[zone.name];
                if (!polyCoords) return null;

                // Leaflet uses [lat, lng] arrays
                const positions: [number, number][] = polyCoords.map(p => [p.lat, p.lng]);

                return (
                    <Polygon
                        key={`poly-${i}`}
                        positions={positions}
                        pathOptions={{
                            fillColor: getPolygonColor(zone),
                            fillOpacity: 0.35,
                            color: getPolygonColor(zone),
                            weight: 2,
                            opacity: 0.8
                        }}
                        eventHandlers={{ click: () => handleZoneClick(zone) }}
                    />
                );
            })}
        </MapContainer>
    );
}
