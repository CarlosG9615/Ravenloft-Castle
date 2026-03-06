package com.gvc.ravenloftcastleapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication(scanBasePackages = "com.gvc.ravenloftcastleapi")
public class RavenloftCastleApiApplication {

	public static void main(String[] args) {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("Admin:    " + encoder.encode("admin"));
        System.out.println("Carlos:    " + encoder.encode("carlos"));
        System.out.println("Valentina: " + encoder.encode("valentina"));
        System.out.println("Gonzalo:   " + encoder.encode("gonzalo"));
        SpringApplication.run(RavenloftCastleApiApplication.class, args);
	}

}
