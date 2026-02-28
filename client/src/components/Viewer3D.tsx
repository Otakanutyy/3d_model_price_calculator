import { useRef, useEffect, useState, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center } from "@react-three/drei";
import * as THREE from "three";
import type { Model3D } from "@/types";

function StlModel({ url }: { url: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
      const loader = new STLLoader();

      // Fetch with auth header
      const token = localStorage.getItem("access_token");
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const buffer = await res.arrayBuffer();
      const geom = loader.parse(buffer);
      if (!cancelled) {
        geom.computeVertexNormals();
        setGeometry(geom);
      }
    };

    load().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!geometry) return null;

  return (
    <Center>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#6b9fff"
          metalness={0.3}
          roughness={0.5}
          flatShading={false}
        />
      </mesh>
    </Center>
  );
}

function ObjModel({ url }: { url: string }) {
  const [group, setGroup] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
      const loader = new OBJLoader();

      const token = localStorage.getItem("access_token");
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const text = await res.text();
      const obj = loader.parse(text);
      if (!cancelled) {
        obj.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
              color: "#6b9fff",
              metalness: 0.3,
              roughness: 0.5,
            });
          }
        });
        setGroup(obj);
      }
    };

    load().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!group) return null;

  return (
    <Center>
      <primitive object={group} />
    </Center>
  );
}

interface Viewer3DProps {
  model: Model3D | null;
  projectId: string;
}

export default function Viewer3D({ model, projectId }: Viewer3DProps) {
  const { t } = useTranslation();
  const controlsRef = useRef<any>(null);

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Empty state
  if (!model) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-400">{t("viewer.uploadHint")}</p>
        </div>
      </div>
    );
  }

  // Processing / error states
  if (model.status === "queued" || model.status === "processing") {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500">
            {model.status === "queued" ? t("viewer.queued") : t("viewer.analyzing")}
          </p>
        </div>
      </div>
    );
  }

  if (model.status === "error") {
    return (
      <div className="h-full flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <div className="text-center px-4">
          <svg className="mx-auto h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="mt-2 text-sm text-red-600 font-medium">{t("viewer.processingError")}</p>
          <p className="mt-1 text-xs text-red-500">{model.error_message || t("viewer.unknownError")}</p>
        </div>
      </div>
    );
  }

  const fileUrl = `/api/projects/${projectId}/model/file`;
  const format = model.format?.toLowerCase();

  return (
    <div className="h-full relative rounded-lg border border-gray-200 overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200">
      <Canvas
        camera={{ position: [50, 50, 50], fov: 45 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <Suspense fallback={null}>
          {format === "stl" && <StlModel url={fileUrl} />}
          {format === "obj" && <ObjModel url={fileUrl} />}
        </Suspense>
        <OrbitControls ref={controlsRef} makeDefault />
        <gridHelper args={[100, 10, "#ccc", "#eee"]} />
      </Canvas>

      {/* Reset button */}
      <button
        onClick={resetView}
        className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-lg shadow-sm border border-gray-200 transition"
        title={t("viewer.resetView")}
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Model info overlay */}
      {model.status === "done" && (
        <div className="absolute bottom-3 left-3 bg-white/90 rounded-lg p-2.5 text-xs text-gray-600 space-y-0.5 shadow-sm border border-gray-100">
          <div>
            <span className="font-medium">{t("viewer.dims")}:</span>{" "}
            {model.dim_x?.toFixed(1)} × {model.dim_y?.toFixed(1)} × {model.dim_z?.toFixed(1)} mm
          </div>
          <div>
            <span className="font-medium">{t("viewer.volume")}:</span> {model.volume?.toFixed(1)} cm³
          </div>
          <div>
            <span className="font-medium">{t("viewer.polygons")}:</span> {model.polygons?.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
