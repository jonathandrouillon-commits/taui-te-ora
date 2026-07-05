"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function RegisterPage() {

  const [firstname,setFirstname]=useState("");
  const [lastname,setLastname]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");

  async function register(){

    const {data,error}=await supabase.auth.signUp({

      email,

      password,

      options:{

        data:{

          firstname,

          lastname,

          role:"adoptant"

        }

      }

    });

    if(error){

      alert(error.message);

      return;

    }

    alert("Compte créé !");
  }

  return(

    <main className="min-h-screen bg-[#fbf7ef] flex justify-center items-center p-10">

      <Card className="max-w-lg w-full space-y-5">

        <h1 className="text-4xl font-black text-[#064b42]">

          Créer un compte

        </h1>

        <Input

        placeholder="Prénom"

        value={firstname}

        onChange={setFirstname}

        />

        <Input

        placeholder="Nom"

        value={lastname}

        onChange={setLastname}

        />

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

        onClick={register}

        className="w-full"

        >

          Créer mon compte

        </Button>

      </Card>

    </main>

  );

}