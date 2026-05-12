package com.gvc.ravenloftcastleapi.controller.suscripcion;

import com.gvc.ravenloftcastleapi.dto.suscripcion.StripeCheckoutRequestDTO;
import com.gvc.ravenloftcastleapi.dto.suscripcion.StripeCheckoutResponseDTO;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stripe")
@CrossOrigin(origins = "http://localhost:5173")
public class StripeController {

    private final String stripeSecretKey;
    private final String frontendUrl;

    public StripeController(
            @Value("${stripe.secret.key:sk_test_51OEXAMPLEKEY}") String stripeSecretKey,
            @Value("${frontend.url:http://localhost:5173}") String frontendUrl) {
        this.stripeSecretKey = stripeSecretKey;
        this.frontendUrl = frontendUrl;
        Stripe.apiKey = this.stripeSecretKey;
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<StripeCheckoutResponseDTO> createCheckoutSession(@RequestBody StripeCheckoutRequestDTO request) {
        try {
            long price;
            String planName;

            switch (request.getTipoPlan().toUpperCase()) {
                case "PREMIUM":
                    price = 499L;
                    planName = "Suscripción Héroe (Mensual) - Ravenloft Castle";
                    break;
                case "VIP":
                    price = 999L;
                    planName = "Suscripción Dungeon Master (Mensual) - Ravenloft Castle";
                    break;
                default:
                    return ResponseEntity.badRequest().build();
            }

            SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                // Redirigir de vuelta al frontend para procesar el pago validado
                .setSuccessUrl(frontendUrl + "/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&plan=" + request.getTipoPlan() + "&usuarioId=" + request.getUsuarioId())
                .setCancelUrl(frontendUrl + "/subscription")
                .addLineItem(
                    SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(
                            SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("eur")
                                .setUnitAmount(price)
                                .setRecurring(
                                    SessionCreateParams.LineItem.PriceData.Recurring.builder()
                                        .setInterval(SessionCreateParams.LineItem.PriceData.Recurring.Interval.MONTH)
                                        .build()
                                )
                                .setProductData(
                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(planName)
                                        .build()
                                )
                                .build()
                        )
                        .build()
                )
                .build();

            Session session = Session.create(params);

            StripeCheckoutResponseDTO response = new StripeCheckoutResponseDTO();
            response.setUrl(session.getUrl());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
