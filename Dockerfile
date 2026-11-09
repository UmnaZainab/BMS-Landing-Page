FROM php:8.2-apache

# System deps for the MongoDB PECL extension, then build + enable it
RUN apt-get update \
 && apt-get install -y --no-install-recommends libssl-dev pkg-config unzip \
 && pecl install mongodb \
 && docker-php-ext-enable mongodb \
 && apt-get purge -y --auto-remove pkg-config \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer binary (multi-stage copy from the official image)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Serve on 8000 (matches the compose port mapping) and deny public access to dotfiles
RUN sed -ri 's/Listen 80/Listen 8000/' /etc/apache2/ports.conf \
 && sed -ri 's!\*:80!\*:8000!' /etc/apache2/sites-available/000-default.conf \
 && printf '<FilesMatch "^\\.">\n    Require all denied\n</FilesMatch>\n' \
      > /etc/apache2/conf-available/deny-dotfiles.conf \
 && a2enconf deny-dotfiles

EXPOSE 8000
WORKDIR /var/www/html

# On first boot the bind-mounted project has no vendor/, so install deps once;
# subsequent starts skip straight to Apache.
CMD ["/bin/sh","-c","[ -d vendor ] || composer install --no-interaction --prefer-dist --no-progress; exec apache2-foreground"]
