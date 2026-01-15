"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Props = {
  onSuccess: () => void;
};

export function CreateDrawForm({ onSuccess }: Props) {
  const [name, setName] = useState("");
  const [drawTime, setDrawTime] = useState("");
  const [lockTime, setLockTime] = useState("");

  const [enable2D, setEnable2D] = useState(true);
  const [enable3D, setEnable3D] = useState(true);
  const [enable4D, setEnable4D] = useState(true);

  const [multiplier2D, setMultiplier2D] = useState(90);
  const [multiplier3D, setMultiplier3D] = useState(900);
  const [multiplier4D, setMultiplier4D] = useState(9000);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // UI-level validation
    if (!name || !drawTime || !lockTime) {
      alert("Please fill all required fields");
      return;
    }

    if (!(enable2D || enable3D || enable4D)) {
      alert("Enable at least one draw type");
      return;
    }

    // TEMP: log data (later replace with Firebase call)
    console.log({
      name,
      drawTime,
      lockTime,
      enable2D,
      enable3D,
      enable4D,
      multipliers: {
        "2D": multiplier2D,
        "3D": multiplier3D,
        "4D": multiplier4D,
      },
    });

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Draw Name */}
      <div className="space-y-1">
        <Label>Draw Name</Label>
        <Input
          placeholder="Evening Draw"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Draw Time</Label>
          <Input
            type="time"
            value={drawTime}
            onChange={(e) => setDrawTime(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Lock Time</Label>
          <Input
            type="time"
            value={lockTime}
            onChange={(e) => setLockTime(e.target.value)}
          />
        </div>
      </div>

      {/* Game Types */}
      <div className="space-y-3">
        <Label>Enable Game Types</Label>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={enable2D}
            onCheckedChange={() => setEnable2D(!enable2D)}
          />
          <span>2 Digit</span>
          <Input
            type="number"
            className="w-24 ml-auto"
            value={multiplier2D}
            onChange={(e) => setMultiplier2D(+e.target.value)}
            disabled={!enable2D}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={enable3D}
            onCheckedChange={() => setEnable3D(!enable3D)}
          />
          <span>3 Digit</span>
          <Input
            type="number"
            className="w-24 ml-auto"
            value={multiplier3D}
            onChange={(e) => setMultiplier3D(+e.target.value)}
            disabled={!enable3D}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={enable4D}
            onCheckedChange={() => setEnable4D(!enable4D)}
          />
          <span>4 Digit</span>
          <Input
            type="number"
            className="w-24 ml-auto"
            value={multiplier4D}
            onChange={(e) => setMultiplier4D(+e.target.value)}
            disabled={!enable4D}
          />
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full">
        Create Draw
      </Button>
    </form>
  );
}
