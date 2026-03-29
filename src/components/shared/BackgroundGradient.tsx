import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import { useTheme } from "@/context/ThemeContext";

export default function BackgroundGradient() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 -z-10">
      <ShaderGradientCanvas style={{ width: "100%", height: "100%" }}>
        {isDark ? (
          <ShaderGradient
            control="props"
            animate="on"
            brightness={1}
            cAzimuthAngle={180}
            cDistance={2.8}
            cPolarAngle={80}
            cameraZoom={9.1}
            color1="#2c2638"
            color2="#2b2634"
            color3="#836b82"
            grain="off"
            envPreset="city"
            lightType="3d"
            positionX={0}
            positionY={0}
            positionZ={0}
            reflection={0.1}
            rotationX={50}
            rotationY={0}
            rotationZ={-100}
            type="waterPlane"
            uAmplitude={0}
            uDensity={1.5}
            uFrequency={0}
            uSpeed={0.04}
            uStrength={1.5}
          />
        ) : (
          <ShaderGradient
            control="props"
            animate="on"
            brightness={1}
            cAzimuthAngle={180}
            cDistance={2.8}
            cPolarAngle={80}
            cameraZoom={9.1}
            color1="#fffbf0"
            color2="#e6e9d4"
            color3="#f7fff5"
            envPreset="city"
            grain="off"
            lightType="3d"
            positionX={0}
            positionY={0}
            positionZ={0}
            reflection={0.1}
            rotationX={50}
            rotationY={0}
            rotationZ={-100}
            type="waterPlane"
            uAmplitude={0}
            uDensity={1.5}
            uFrequency={0}
            uSpeed={0.04}
            uStrength={1.5}
          />
        )}
      </ShaderGradientCanvas>
    </div>
  );
}
