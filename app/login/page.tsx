"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function LoginPage() {

  const router = useRouter();

  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);

  async function login(){

    setLoading(true);

    const {error}=await supabase.auth.signInWithPassword({

      email,
      password

    });

    setLoading(false);

    if(error){

      alert(error.message);

      return;

    }

    router.push("/");

  }

  return(

    <main className="min-h-screen bg-[#fbf7ef] flex justify-center items-center p-10">

      <Card className="max-w-lg w-full space-y-5">

        <h1 className="text-4xl font-black text-[#064b42]">

          Connexion

        </h1>

        <Input

          placeholder="Email"

          value={email}

          onChange={setEmail}

        />

        <Input

          type="password"

          placeholder="Mot de passe"

          value={password}

          onChange={setPassword}

        />

        <Button

          onClick={login}

          className="w-full"

        >

          {loading ? "Connexion..." : "Se connecter"}

        </Button>

      </Card>

    </main>

  );

}