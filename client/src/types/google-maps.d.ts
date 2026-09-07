declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement | null, opts?: MapOptions);
      setCenter(latlng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      setMapTypeId(mapTypeId: MapTypeId | string): void;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: MapTypeId | string;
      mapTypeControl?: boolean;
      mapTypeControlOptions?: MapTypeControlOptions;
      zoomControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      gestureHandling?: string;
    }

    interface MapTypeControlOptions {
      style?: MapTypeControlStyle;
      position?: ControlPosition;
    }

    enum MapTypeControlStyle {
      DEFAULT = 0,
      HORIZONTAL_BAR = 1,
      DROPDOWN_MENU = 2,
      INSET = 3,
      INSET_LARGE = 4
    }

    enum ControlPosition {
      BOTTOM_CENTER = 11,
      BOTTOM_LEFT = 10,
      BOTTOM_RIGHT = 12,
      LEFT_BOTTOM = 6,
      LEFT_CENTER = 4,
      LEFT_TOP = 5,
      RIGHT_BOTTOM = 9,
      RIGHT_CENTER = 8,
      RIGHT_TOP = 7,
      TOP_CENTER = 2,
      TOP_LEFT = 1,
      TOP_RIGHT = 3
    }

    type MapTypeId = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

    interface LatLng {
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: Function): void;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: Icon | Symbol | string;
    }

    interface Icon {
      url?: string;
      size?: Size;
      origin?: Point;
      anchor?: Point;
      scaledSize?: Size;
    }

    interface Symbol {
      path: SymbolPath | string;
      scale?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
      strokeOpacity?: number;
      anchor?: Point;
      labelOrigin?: Point;
      rotation?: number;
    }

    enum SymbolPath {
      BACKWARD_CLOSED_ARROW = 3,
      BACKWARD_OPEN_ARROW = 4,
      CIRCLE = 0,
      FORWARD_CLOSED_ARROW = 1,
      FORWARD_OPEN_ARROW = 2
    }

    interface Size {
      width: number;
      height: number;
    }

    interface Point {
      x: number;
      y: number;
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      setContent(content: string | Element): void;
      open(map?: Map, anchor?: Marker): void;
      close(): void;
    }

    interface InfoWindowOptions {
      content?: string | Element;
      position?: LatLng | LatLngLiteral;
      pixelOffset?: Size;
      maxWidth?: number;
    }

    namespace places {
      class PlacesService {
        constructor(attrContainer: Map | HTMLDivElement);
        textSearch(request: TextSearchRequest, callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void): void;
      }

      interface TextSearchRequest {
        query: string;
        fields?: string[];
        location?: LatLng | LatLngLiteral;
        radius?: number;
      }

      interface PlaceResult {
        name?: string;
        formatted_address?: string;
        geometry?: PlaceGeometry;
        photos?: PlacePhoto[];
        place_id?: string;
      }

      interface PlaceGeometry {
        location?: LatLng;
        viewport?: LatLngBounds;
      }

      interface PlacePhoto {
        getUrl(opts: PhotoOptions): string;
      }

      interface PhotoOptions {
        maxWidth?: number;
        maxHeight?: number;
      }

      interface LatLngBounds {
        getNorthEast(): LatLng;
        getSouthWest(): LatLng;
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
        ZERO_RESULTS = 'ZERO_RESULTS'
      }
    }

    namespace geometry {
      interface SphericalGeometry {
        computeDistanceBetween(from: LatLng, to: LatLng, radius?: number): number;
        computeHeading(from: LatLng, to: LatLng): number;
        computeLength(path: LatLng[], radius?: number): number;
        computeArea(path: LatLng[], radius?: number): number;
        computeSignedArea(loop: LatLng[], radius?: number): number;
        interpolate(from: LatLng, to: LatLng, fraction: number): LatLng;
      }
    }
  }

  namespace maps.marker {
    class AdvancedMarkerElement {
      constructor(options?: AdvancedMarkerElementOptions);
      map: google.maps.Map | null;
      position: google.maps.LatLng | google.maps.LatLngLiteral | null;
      title: string;
      content: Element | google.maps.marker.PinElement | null;
      gmpDraggable: boolean;
      gmpClickable: boolean;
      zIndex: number | null;
      addListener(eventName: string, handler: Function): google.maps.MapsEventListener;
    }

    interface AdvancedMarkerElementOptions {
      map?: google.maps.Map;
      position?: google.maps.LatLng | google.maps.LatLngLiteral;
      title?: string;
      content?: Element | google.maps.marker.PinElement;
      gmpDraggable?: boolean;
      gmpClickable?: boolean;
      zIndex?: number;
    }

    class PinElement {
      constructor(options?: PinElementOptions);
      background: string;
      borderColor: string;
      glyph: string | Element | URL;
      glyphColor: string;
      scale: number;
    }

    interface PinElementOptions {
      background?: string;
      borderColor?: string;
      glyph?: string | Element | URL;
      glyphColor?: string;
      scale?: number;
    }
  }

  interface MapsEventListener {
    remove(): void;
  }
}

export {};