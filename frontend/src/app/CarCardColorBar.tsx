"use client";

import React, { useState } from "react";
import { getCarColors, CarColorOption } from "./carColors";

interface Props {
  carName: string;
  onOpen3D: () => void;
  onColorSelect?: (color: CarColorOption) => void;
}

export const CarCardColorBar: React.FC<Props> = ({ carName, onOpen3D, onColorSelect }) => {
  const colors = getCarColors(carName);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const activeColor = colors[selectedIdx] || colors[0];

  const handleSelect = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIdx(idx);
    if (onColorSelect) {
      onColorSelect(colors[idx]);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 8px",
        background: "rgba(15, 23, 42, 0.6)",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        marginTop: "8px",
        marginBottom: "4px",
      }}
    >
      {/* Color Dots */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "10px", color: "#94a3b8", marginRight: "2px" }}>สี:</span>
        {colors.slice(0, 5).map((col, idx) => {
          const isSelected = idx === selectedIdx;
          return (
            <button
              key={col.name}
              title={`${col.thaiName} (${col.name})`}
              onClick={(e) => handleSelect(idx, e)}
              style={{
                width: isSelected ? "18px" : "15px",
                height: isSelected ? "18px" : "15px",
                borderRadius: "50%",
                backgroundColor: col.hex,
                border: isSelected ? "2px solid #38bdf8" : "1.5px solid rgba(255, 255, 255, 0.2)",
                boxShadow: isSelected ? "0 0 8px rgba(56, 189, 248, 0.6)" : "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.2s ease",
                transform: isSelected ? "scale(1.15)" : "scale(1)",
              }}
            />
          );
        })}
        <span style={{ fontSize: "10.5px", color: "#cbd5e1", marginLeft: "4px", fontWeight: 500 }}>
          {activeColor.thaiName}
        </span>
      </div>

      {/* 3D 360° Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpen3D();
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          background: "linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(30, 58, 138, 0.4) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.4)",
          color: "#38bdf8",
          fontSize: "11px",
          fontWeight: 700,
          padding: "3px 9px",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(2, 132, 199, 0.2)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#0284c7";
          (e.currentTarget as HTMLElement).style.color = "#ffffff";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(30, 58, 138, 0.4) 100%)";
          (e.currentTarget as HTMLElement).style.color = "#38bdf8";
        }}
      >
        <span>🎨 สตูดิโอตรงรุ่น & 3D</span>
      </button>
    </div>
  );
};
