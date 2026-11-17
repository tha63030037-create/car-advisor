"use client";

import React, { useState, useEffect, useRef } from "react";
import { CarColorOption, getCarColors } from "./carColors";

interface CarPhoto {
  file: string;
  credit: string | null;
}

interface Car {
  id: number;
  name: string;
  bodyType: string;
  fuelType: string;
  price: number;
  consumption: string;
  seats: number;
  lifestyle: string[];
  serviceNetwork: string;
  nationality: string;
  transmission: string;
  horsepower: number;
  warrantyYears: number;
  warrantyKm: number;
  airbags: number;
  photo: CarPhoto;
}

interface Props {
  car: Car | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CarConfiguratorModal: React.FC<Props> = ({ car, isOpen, onClose }) => {
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"exact_car" | "3d_webgl">("exact_car");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [lightsOn, setLightsOn] = useState(false);
  const [finish, setFinish] = useState<"gloss" | "pearl" | "matte">("gloss");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const colors = car ? getCarColors(car.name) : [];
  const activeColor: CarColorOption = colors[selectedColorIdx] || colors[0];

  useEffect(() => {
    // Reset state when car changes
    setSelectedColorIdx(0);
    setViewMode("exact_car");
    setIsFlipped(false);
    setIsZoomed(false);
    setLightsOn(false);
    setFinish("gloss");
  }, [car]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle 3D iframe communication
  const handleColorChange = (idx: number, hex: string) => {
    setSelectedColorIdx(idx);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "SET_COLOR",
          color: hex,
        },
        "*"
      );
    }
  };

  const handleFinishChange = (newFinish: "gloss" | "pearl" | "matte") => {
    setFinish(newFinish);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "SET_FINISH",
          finish: newFinish,
        },
        "*"
      );
    }
  };

  if (!isOpen || !car) return null;

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("th-TH").format(p) + " บาท";
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(3, 7, 18, 0.92)",
        backdropFilter: "blur(20px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1040px",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 14, 26, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          borderRadius: "24px",
          boxShadow: "0 30px 80px -15px rgba(0, 0, 0, 0.95)",
          overflow: "hidden",
          maxHeight: "94vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(15, 23, 42, 0.75)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }}
              >
                🚗 รถยนต์ตรงรุ่น 100%
              </span>
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
                {car.bodyType.toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", margin: 0 }}>
              {car.name}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>ราคาจำหน่ายเริ่มต้น</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#38bdf8" }}>
                {formatPrice(car.price)}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                color: "#e2e8f0",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              aria-label="ปิดหน้าต่าง"
            >
              ✕
            </button>
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div
          style={{
            padding: "10px 24px",
            background: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setViewMode("exact_car")}
              style={{
                padding: "7px 18px",
                borderRadius: "10px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                background: viewMode === "exact_car" ? "#0284c7" : "rgba(255, 255, 255, 0.06)",
                color: viewMode === "exact_car" ? "#ffffff" : "#94a3b8",
                border: viewMode === "exact_car" ? "1px solid #38bdf8" : "1px solid transparent",
                boxShadow: viewMode === "exact_car" ? "0 0 12px rgba(2, 132, 199, 0.5)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🚗 {car.name} (ภาพสตูดิโอตรงรุ่น)</span>
            </button>

            <button
              onClick={() => setViewMode("3d_webgl")}
              style={{
                padding: "7px 18px",
                borderRadius: "10px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                background: viewMode === "3d_webgl" ? "#8b5cf6" : "rgba(255, 255, 255, 0.06)",
                color: viewMode === "3d_webgl" ? "#ffffff" : "#94a3b8",
                border: viewMode === "3d_webgl" ? "1px solid #c084fc" : "1px solid transparent",
                boxShadow: viewMode === "3d_webgl" ? "0 0 12px rgba(139, 92, 246, 0.5)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🏎️ 3D WebGL Showroom (หมุน 360° รอบคัน)</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 600 }}>
              ✨ โหมดภาพ 8K Dark Cyclorama Studio
            </span>
          </div>
        </div>

        {/* Visual Stage */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "440px",
            background: "radial-gradient(ellipse at 50% 45%, #182236 0%, #0d1322 60%, #06080e 100%)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {viewMode === "exact_car" ? (
            /* EXACT CAR MODEL: Pristine 8K Studio Commercial Render of this specific car */
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: `${isFlipped ? "scaleX(-1)" : "scaleX(1)"} ${isZoomed ? "scale(1.2)" : "scale(1)"}`,
              }}
            >
              {/* Dynamic Studio Underglow Spotlight matching the active color */}
              <div
                style={{
                  position: "absolute",
                  bottom: "18%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "560px",
                  height: "130px",
                  background: `radial-gradient(ellipse at center, ${activeColor?.hex || "#38bdf8"}44 0%, transparent 70%)`,
                  filter: "blur(25px)",
                  pointerEvents: "none",
                  transition: "background 0.5s ease",
                }}
              />

              <img
                key={activeColor?.imageFile || car.photo?.file}
                src={activeColor?.imageFile ? `/cars/${activeColor.imageFile}` : `/cars/${car.photo?.file || ""}`}
                alt={`${car.name} - ${activeColor?.thaiName}`}
                style={{
                  maxWidth: "94%",
                  maxHeight: "94%",
                  objectFit: "contain",
                  display: "block",
                  filter: "drop-shadow(0 25px 35px rgba(0, 0, 0, 0.95))",
                  transition: "all 0.35s ease-in-out",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `/cars/${car.photo?.file || "01-toyota-yaris-ativ.png"}`;
                }}
              />

              {/* Headlights Radiant Flare Effect */}
              {lightsOn && (
                <div
                  style={{
                    position: "absolute",
                    top: "52%",
                    left: isFlipped ? "65%" : "32%",
                    width: "180px",
                    height: "180px",
                    transform: "translate(-50%, -50%)",
                    background: "radial-gradient(circle, rgba(224, 242, 254, 0.95) 0%, rgba(56, 189, 248, 0.6) 25%, transparent 70%)",
                    pointerEvents: "none",
                    filter: "blur(8px)",
                  }}
                />
              )}

              {/* Dark Studio Floor Reflection Gradient */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "50px",
                  background: "linear-gradient(to top, rgba(6, 8, 14, 0.95), transparent)",
                  pointerEvents: "none",
                }}
              />
            </div>
          ) : (
            /* 3D WebGL Configurator (Ferrari Three.js engine) */
            <iframe
              ref={iframeRef}
              src={`/3d/configurator.html?embed=true&color=${encodeURIComponent(activeColor?.hex || "#b9151e")}`}
              title="3D Configurator"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            />
          )}

          {/* Color & Model Name Badge on Stage */}
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "20px",
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              padding: "8px 18px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              pointerEvents: "none",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.6)",
              zIndex: 20,
            }}
          >
            <span
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: activeColor?.hex || "#b9151e",
                border: "2px solid rgba(255, 255, 255, 0.6)",
                display: "inline-block",
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.4)",
              }}
            />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>
              {activeColor?.thaiName} ({activeColor?.name})
            </span>
          </div>

          {/* Quick Stage Controls (Flip, Zoom, Lights) */}
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "20px",
              display: "flex",
              gap: "8px",
              zIndex: 20,
            }}
          >
            {viewMode === "exact_car" && (
              <>
                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "10px",
                    background: isFlipped ? "rgba(2, 132, 199, 0.4)" : "rgba(15, 23, 42, 0.85)",
                    border: isFlipped ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  🔄 สลับมุมมอง (Flip View)
                </button>

                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "10px",
                    background: isZoomed ? "rgba(2, 132, 199, 0.4)" : "rgba(15, 23, 42, 0.85)",
                    border: isZoomed ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  🔍 {isZoomed ? "ซูมออก" : "ซูมดูดีเทล"}
                </button>

                <button
                  type="button"
                  onClick={() => setLightsOn(!lightsOn)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "10px",
                    background: lightsOn ? "rgba(234, 179, 8, 0.35)" : "rgba(15, 23, 42, 0.85)",
                    border: lightsOn ? "1px solid #eab308" : "1px solid rgba(255, 255, 255, 0.2)",
                    color: lightsOn ? "#fef08a" : "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  💡 {lightsOn ? "ปิดไฟหน้า" : "เปิดไฟหน้า LED"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Color Palette Bar */}
        <div
          style={{
            padding: "18px 24px",
            background: "rgba(15, 23, 42, 0.95)",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.02em" }}>
              🎨 สีตัวถังทางการประจำรุ่นของ {car.name} ({colors.length} สีมาตรฐานจากศูนย์ไทย):
            </span>

            {/* Finish Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>ลักษณะเนื้อสี:</span>
              <button
                onClick={() => handleFinishChange("gloss")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "11.5px",
                  cursor: "pointer",
                  background: finish === "gloss" ? "#0284c7" : "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  border: finish === "gloss" ? "1px solid #38bdf8" : "none",
                  fontWeight: 600,
                }}
              >
                ✨ Metallic Gloss
              </button>
              <button
                onClick={() => handleFinishChange("pearl")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "11.5px",
                  cursor: "pointer",
                  background: finish === "pearl" ? "#0284c7" : "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  border: finish === "pearl" ? "1px solid #38bdf8" : "none",
                  fontWeight: 600,
                }}
              >
                💎 Pearl Mica
              </button>
              <button
                onClick={() => handleFinishChange("matte")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "11.5px",
                  cursor: "pointer",
                  background: finish === "matte" ? "#0284c7" : "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  border: finish === "matte" ? "1px solid #38bdf8" : "none",
                  fontWeight: 600,
                }}
              >
                🛡️ Satin Matte
              </button>
            </div>
          </div>

          {/* Color Buttons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              paddingBottom: "4px",
            }}
          >
            {colors.map((col, idx) => {
              const isSelected = idx === selectedColorIdx;
              return (
                <button
                  key={col.name}
                  onClick={() => handleColorChange(idx, col.hex)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 16px",
                    borderRadius: "14px",
                    background: isSelected ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    border: isSelected ? "2px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.12)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                    boxShadow: isSelected ? "0 0 14px rgba(56, 189, 248, 0.4)" : "none",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: col.hex,
                      border: "1.5px solid rgba(255, 255, 255, 0.5)",
                      boxShadow: "inset 0 1px 3px rgba(255, 255, 255, 0.6), 0 2px 5px rgba(0,0,0,0.4)",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: isSelected ? "#38bdf8" : "#f1f5f9" }}>
                      {col.thaiName}
                    </div>
                    <div style={{ fontSize: "10.5px", color: isSelected ? "#93c5fd" : "#94a3b8", whiteSpace: "nowrap" }}>
                      {col.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: "12px 24px",
            background: "rgba(10, 14, 26, 0.95)",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
            color: "#94a3b8",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {activeColor?.imageFile ? (
              <span style={{ color: "#10b981", fontWeight: 700 }}>
                ✓ สลับภาพเรนเดอร์สตูดิโอตรงสี {activeColor.thaiName} ({activeColor.name}) คมชัด 100%
              </span>
            ) : (
              <span style={{ color: "#10b981", fontWeight: 600 }}>
                ✓ แสดงภาพโมเดลตรงรุ่น 100% ({car.name})
              </span>
            )}
            <span style={{ color: "#38bdf8" }}>⚡️ มาตรฐาน 8K Studio Cyclorama Lighting</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <a
              href="/3d/configurator.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "12px",
                color: "#38bdf8",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              เปิดสตูดิโอ 3D เต็มจอ ↗
            </a>

            <button
              onClick={onClose}
              style={{
                padding: "7px 22px",
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "12.5px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.4)",
              }}
            >
              ตกลง / ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
